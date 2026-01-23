"""
MCP-Style Campaign Agent.
Central agent that handles campaign conversations and tool execution
using Model Context Protocol style tool schemas and dynamic prompt generation.

This implementation uses a simple tool-calling approach that works with
various LangChain versions without relying on the complex AgentExecutor imports.
"""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Any, Optional
import os
import logging
import json

# Initialize logger early for error messages
logger = logging.getLogger(__name__)

from .prompt_builder import get_campaign_agent_prompt
from tools.registry import ALL_TOOLS, TOOL_EXECUTORS


class CampaignAgent:
    """
    Simple LangChain agent for campaign management using direct tool calling.
    
    Uses:
    - Centralized JSON Schema tool definitions (tools/schema.py)
    - Dynamic system prompt generation (agents/prompt_builder.py)
    - Tool registry mapping schemas to executors (tools/registry.py)
    - Direct Gemini tool calling (no AgentExecutor dependency)
    """
    
    def __init__(self, model_name: str = None, temperature: float = 0.7):
        """
        Initialize the campaign agent.
        
        Args:
            model_name: Google Gemini model to use (defaults to GEMINI_MODEL env var or gemini-1.5-flash)
            temperature: Temperature for model responses
        """
        # Get model from env var or use default
        model = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        logger.info(f"Using Gemini model: {model}")
        
        # Initialize the LLM
        self.llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )
        
        # Bind tools to the LLM for tool calling
        self.tools = ALL_TOOLS
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        
        # Build the system prompt dynamically from MCP schemas
        self.system_prompt = get_campaign_agent_prompt()
        logger.debug(f"Generated system prompt ({len(self.system_prompt)} chars)")
        
        # Max iterations to prevent infinite loops
        self.max_iterations = 10
        
        logger.info(f"Campaign agent initialized with {len(ALL_TOOLS)} tools")
    
    def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        campaign_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return agent response.
        Uses direct tool calling with an agentic loop.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            campaign_id: Current campaign ID for associating data
            user_id: Current user ID for ownership
            
        Returns:
            Dictionary with response and metadata
        """
        # Store campaign context for tool calls
        self.current_campaign_id = campaign_id
        self.current_user_id = user_id
        
        try:
            # Build messages list with campaign context in system prompt
            campaign_context = ""
            if campaign_id:
                campaign_context = f"\n\nCURRENT CAMPAIGN CONTEXT:\n- Campaign ID: {campaign_id}\n- User ID: {user_id}\nAll filtered contacts and emails should be automatically associated with this campaign. Do NOT ask the user for campaign ID."
            
            messages = [SystemMessage(content=self.system_prompt + campaign_context)]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    # Handle content that might be an object
                    if isinstance(content, list):
                        # Extract text from Gemini's response format
                        text_parts = [p.get('text', '') for p in content if isinstance(p, dict) and 'text' in p]
                        content = '\n'.join(text_parts) if text_parts else str(content)
                    elif not isinstance(content, str):
                        content = str(content)
                    
                    if role == "user":
                        messages.append(HumanMessage(content=content))
                    elif role == "assistant":
                        messages.append(AIMessage(content=content))
            
            # Add current message
            messages.append(HumanMessage(content=message))
            
            logger.info(f"Processing message with {len(messages)} total messages for campaign {campaign_id}")
            
            # Track tool calls for campaign state
            tool_calls_history = []
            total_cost = 0.0
            
            # Tool cost mapping (in USDC) - only major tools require payment
            # Prices are 10x base rate. Search includes filtering (grouped payment)
            PAID_TOOLS = {
                "apollo_search_people": 1.0,  # Includes filtering - one payment for lead generation
                "gmail_tool": 2.0,  # For sending emails
            }
            
            # Free tools (no payment required) - filter is free since it's part of search workflow
            FREE_TOOLS = ["ask_for_clarification", "repeat_campaign_action", "filter_contacts_by_company_criteria"]
            
            # Agentic loop - call LLM, execute tools, repeat until done
            for iteration in range(self.max_iterations):
                logger.info(f"Agent iteration {iteration + 1}/{self.max_iterations}")
                
                # Call LLM with tools
                response = self.llm_with_tools.invoke(messages)
                
                # Check if there are tool calls
                if not response.tool_calls:
                    # No tool calls - return the response
                    response_text = self._extract_text_content(response.content)
                    logger.info(f"Agent completed with response: {response_text[:100]}...")
                    
                    # Save tool calls to campaign state
                    if campaign_id and tool_calls_history:
                        self._save_tool_calls(campaign_id, tool_calls_history)
                    
                    return {
                        "success": True,
                        "message": response_text,
                        "response": response_text,
                        "cost": 0,  # No cost for non-tool responses
                        "tool_calls": tool_calls_history
                    }
                
                # Process tool calls
                messages.append(response)  # Add assistant's response with tool calls
                
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_id = tool_call.get("id", tool_name)
                    
                    # Inject campaign context into tool args if not present
                    if campaign_id and "campaign_id" not in tool_args:
                        tool_args["campaign_id"] = campaign_id
                    if user_id and "user_id" not in tool_args:
                        tool_args["user_id"] = user_id
                    
                    logger.info(f"Tool requested: {tool_name} with args: {json.dumps(tool_args, indent=2)[:200]}")
                    
                    # Check if this is a PAID tool - require payment BEFORE execution
                    if tool_name in PAID_TOOLS:
                        tool_cost = PAID_TOOLS[tool_name]
                        
                        # Save pending action to campaign for later execution
                        pending_action = {
                            "tool_name": tool_name,
                            "tool_args": tool_args,
                            "tool_id": tool_id,
                            "cost": tool_cost
                        }
                        self._save_pending_action(campaign_id, pending_action)
                        
                        # Generate a user-friendly description
                        action_descriptions = {
                            "apollo_search_people": "search and filter leads",
                            "gmail_tool": "send emails"
                        }
                        action_desc = action_descriptions.get(tool_name, f"execute {tool_name}")
                        
                        logger.info(f"Payment required for {tool_name}: {tool_cost} USDC")
                        
                        return {
                            "success": True,
                            "message": f"Ready to {action_desc}. Payment of {tool_cost:.2f} USDC required to proceed.",
                            "response": f"Ready to {action_desc}. Payment of {tool_cost:.2f} USDC required to proceed.",
                            "cost": tool_cost,
                            "pending_action": pending_action,
                            "requires_payment": True,
                            "tool_calls": tool_calls_history
                        }
                    
                    # Free tool - execute immediately
                    tool_call_record = {
                        "tool_name": tool_name,
                        "tool_args": tool_args,
                        "iteration": iteration + 1
                    }
                    tool_calls_history.append(tool_call_record)
                    
                    # Find and execute the tool
                    tool_result = self._execute_tool(tool_name, tool_args)
                    
                    # Add tool result to messages
                    from langchain_core.messages import ToolMessage
                    messages.append(ToolMessage(
                        content=str(tool_result),
                        tool_call_id=tool_id
                    ))
                    
                    logger.info(f"Tool {tool_name} result: {str(tool_result)[:200]}...")
            
            # If we've exhausted iterations
            logger.warning(f"Agent reached max iterations ({self.max_iterations})")
            
            # Save tool calls even if max iterations reached
            if campaign_id and tool_calls_history:
                self._save_tool_calls(campaign_id, tool_calls_history)
            
            return {
                "success": True,
                "message": "I've processed your request. Let me know if you need anything else.",
                "response": "I've processed your request. Let me know if you need anything else.",
                "cost": 0,
                "tool_calls": tool_calls_history
            }
            
        except Exception as e:
            logger.exception(f"Error in agent chat: {str(e)}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}",
                "error": str(e)
            }
    
    def _extract_text_content(self, content: Any) -> str:
        """Extract plain text from various response formats."""
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            # Handle Gemini's response format: [{"type": "text", "text": "..."}]
            text_parts = []
            for part in content:
                if isinstance(part, dict):
                    if 'text' in part:
                        text_parts.append(part['text'])
                    elif 'content' in part:
                        text_parts.append(str(part['content']))
                elif isinstance(part, str):
                    text_parts.append(part)
            return '\n'.join(text_parts) if text_parts else str(content)
        elif isinstance(content, dict):
            if 'text' in content:
                return content['text']
            elif 'content' in content:
                return str(content['content'])
            return json.dumps(content, indent=2)
        else:
            return str(content) if content else "I apologize, but I couldn't generate a response."
    
    def _execute_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> str:
        """Execute a tool by name with the given arguments."""
        try:
            # Find the tool executor
            executor = TOOL_EXECUTORS.get(tool_name)
            if not executor:
                return json.dumps({
                    "status": "error",
                    "message": f"Tool '{tool_name}' not found"
                })
            
            # Execute the tool
            result = executor(**tool_args)
            return result
            
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            return json.dumps({
                "status": "error",
                "message": f"Error executing {tool_name}: {str(e)}"
            })
    
    def _save_tool_calls(self, campaign_id: str, tool_calls_history: List[Dict]) -> None:
        """Save tool calls to campaign state."""
        try:
            from core.db import get_db_connection
            import json as json_lib
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get existing tool calls
            cursor.execute('SELECT tool_calls FROM campaigns WHERE id = ?', (campaign_id,))
            row = cursor.fetchone()
            existing_calls = []
            if row and row[0]:
                try:
                    existing_calls = json_lib.loads(row[0])
                except:
                    existing_calls = []
            
            # Append new tool calls
            existing_calls.extend(tool_calls_history)
            
            # Save updated tool calls
            cursor.execute(
                'UPDATE campaigns SET tool_calls = ? WHERE id = ?',
                (json_lib.dumps(existing_calls), campaign_id)
            )
            conn.commit()
            conn.close()
            logger.info(f"Saved {len(tool_calls_history)} tool calls to campaign {campaign_id}")
        except Exception as e:
            logger.error(f"Failed to save tool calls: {e}")
    
    def _save_pending_action(self, campaign_id: str, pending_action: Dict) -> None:
        """Save pending action that requires payment before execution."""
        try:
            from core.db import get_db_connection
            import json as json_lib
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                'UPDATE campaigns SET pending_action = ? WHERE id = ?',
                (json_lib.dumps(pending_action), campaign_id)
            )
            conn.commit()
            conn.close()
            logger.info(f"Saved pending action {pending_action['tool_name']} to campaign {campaign_id}")
        except Exception as e:
            logger.error(f"Failed to save pending action: {e}")
    
    def execute_pending_action(self, campaign_id: str, user_id: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Execute a pending action after payment has been processed.
        Then CONTINUE the agent loop to process subsequent steps (like filtering).
        """
        try:
            from core.db import get_db_connection
            import json as json_lib
            from langchain_core.messages import ToolMessage
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get pending action
            cursor.execute('SELECT pending_action FROM campaigns WHERE id = ?', (campaign_id,))
            row = cursor.fetchone()
            
            if not row or not row[0]:
                return {
                    "success": False,
                    "message": "No pending action found for this campaign.",
                    "error": "No pending action"
                }
            
            pending_action = json_lib.loads(row[0])
            tool_name = pending_action.get("tool_name")
            tool_args = pending_action.get("tool_args", {})
            tool_id = pending_action.get("tool_id", tool_name)
            
            # Inject campaign/user context
            tool_args["campaign_id"] = campaign_id
            tool_args["user_id"] = user_id
            
            logger.info(f"Executing pending action: {tool_name}")
            
            # Execute the tool
            tool_result = self._execute_tool(tool_name, tool_args)
            
            # Clear pending action
            cursor.execute(
                'UPDATE campaigns SET pending_action = NULL WHERE id = ?',
                (campaign_id,)
            )
            conn.commit()
            conn.close()
            
            # Save to tool calls history
            tool_call_record = {
                "tool_name": tool_name,
                "tool_args": tool_args,
                "paid": True
            }
            self._save_tool_calls(campaign_id, [tool_call_record])
            
            logger.info(f"Tool {tool_name} executed. Now continuing agent loop...")
            
            # --- CONTINUE THE AGENT LOOP ---
            # Build messages with conversation history + tool result
            campaign_context = f"\n\nCURRENT CAMPAIGN CONTEXT:\n- Campaign ID: {campaign_id}\n- User ID: {user_id}\nAll filtered contacts and emails should be automatically associated with this campaign. Do NOT ask the user for campaign ID."
            
            messages = [SystemMessage(content=self.system_prompt + campaign_context)]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    if isinstance(content, list):
                        text_parts = [p.get('text', '') for p in content if isinstance(p, dict) and 'text' in p]
                        content = '\n'.join(text_parts) if text_parts else str(content)
                    elif not isinstance(content, str):
                        content = str(content)
                    
                    if role == "user":
                        messages.append(HumanMessage(content=content))
                    elif role == "assistant":
                        messages.append(AIMessage(content=content))
            
            # Add the tool result as if the LLM had called the tool
            # We need to simulate the tool call response structure
            messages.append(AIMessage(
                content="",
                tool_calls=[{"name": tool_name, "args": tool_args, "id": tool_id}]
            ))
            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_id))
            
            # Track tool calls and costs for continuation
            tool_calls_history = [tool_call_record]
            total_cost = 0.0
            
            # Prices are 10x base rate. Search includes filtering (grouped payment)
            PAID_TOOLS = {
                "apollo_search_people": 1.0,  # Includes filtering
                "gmail_tool": 2.0,  # For sending emails
            }
            # Filter is FREE - part of search workflow
            FREE_TOOLS = ["filter_contacts_by_company_criteria"]
            
            # Continue the agent loop
            for iteration in range(self.max_iterations):
                logger.info(f"Post-payment iteration {iteration + 1}/{self.max_iterations}")
                
                response = self.llm_with_tools.invoke(messages)
                
                # Check if there are more tool calls
                if not response.tool_calls:
                    # No more tool calls - return final response
                    response_text = self._extract_text_content(response.content)
                    logger.info(f"Agent completed post-payment with: {response_text[:100]}...")
                    
                    if tool_calls_history:
                        self._save_tool_calls(campaign_id, tool_calls_history[1:])  # Don't double-save first tool
                    
                    return {
                        "success": True,
                        "message": response_text,
                        "response": response_text,
                        "tool_name": tool_name,
                        "cost": total_cost
                    }
                
                # Process additional tool calls
                messages.append(response)
                
                for tc in response.tool_calls:
                    tc_name = tc["name"]
                    tc_args = tc["args"]
                    tc_id = tc.get("id", tc_name)
                    
                    # Inject context
                    if "campaign_id" not in tc_args:
                        tc_args["campaign_id"] = campaign_id
                    if "user_id" not in tc_args:
                        tc_args["user_id"] = user_id
                    
                    logger.info(f"Post-payment executing: {tc_name}")
                    
                    # Check if this is a paid tool
                    if tc_name in PAID_TOOLS:
                        tool_cost = PAID_TOOLS[tc_name]
                        
                        # Save as new pending action and request payment
                        new_pending = {
                            "tool_name": tc_name,
                            "tool_args": tc_args,
                            "tool_id": tc_id,
                            "cost": tool_cost
                        }
                        self._save_pending_action(campaign_id, new_pending)
                        
                        action_descriptions = {
                            "apollo_search_people": "search and filter leads",
                            "gmail_tool": "send emails"
                        }
                        action_desc = action_descriptions.get(tc_name, f"execute {tc_name}")
                        
                        return {
                            "success": True,
                            "message": f"Ready to {action_desc}. Payment of {tool_cost:.2f} USDC required to proceed.",
                            "response": f"Ready to {action_desc}. Payment of {tool_cost:.2f} USDC required to proceed.",
                            "cost": tool_cost,
                            "pending_action": new_pending,
                            "requires_payment": True,
                            "tool_name": tool_name
                        }
                    
                    # Free tool - execute immediately
                    tc_record = {
                        "tool_name": tc_name,
                        "tool_args": tc_args,
                        "iteration": iteration + 1
                    }
                    tool_calls_history.append(tc_record)
                    
                    tc_result = self._execute_tool(tc_name, tc_args)
                    messages.append(ToolMessage(content=str(tc_result), tool_call_id=tc_id))
                    
                    logger.info(f"Tool {tc_name} result: {str(tc_result)[:200]}...")
            
            # Max iterations reached
            return {
                "success": True,
                "message": "Processing complete.",
                "response": "Processing complete.",
                "tool_name": tool_name
            }
            
        except Exception as e:
            logger.exception(f"Error executing pending action: {e}")
            return {
                "success": False,
                "message": f"Error executing action: {str(e)}",
                "error": str(e)
            }
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names."""
        return [tool.name for tool in ALL_TOOLS]
    
    def get_tool_info(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific tool."""
        from tools.schema import get_tool_by_name
        return get_tool_by_name(tool_name)


# Singleton instance
# Singleton instance
_agent_instance: Optional[CampaignAgent] = None

def get_agent() -> CampaignAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = CampaignAgent()
    return _agent_instance


def reset_agent() -> None:
    """Reset the agent instance (useful for testing or config changes)."""
    global _agent_instance
    _agent_instance = None
    logger.info("Agent instance reset")
