"""
MCP-Style Campaign Agent.
Central agent that handles campaign conversations and tool execution
using Model Context Protocol style tool schemas and dynamic prompt generation.
"""

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
import os
import logging
import json

from .prompt_builder import get_campaign_agent_prompt
from tools.registry import ALL_TOOLS

logger = logging.getLogger(__name__)


class CampaignAgent:
    """
    MCP-Style LangChain agent for campaign management.
    
    Uses:
    - Centralized JSON Schema tool definitions (tools/schema.py)
    - Dynamic system prompt generation (agents/prompt_builder.py)
    - Tool registry mapping schemas to executors (tools/registry.py)
    """
    
    def __init__(self, model_name: str = "gemini-1.5-pro", temperature: float = 0.7):
        """
        Initialize the campaign agent.
        
        Args:
            model_name: Google Gemini model to use
            temperature: Temperature for model responses
        """
        # Initialize the LLM
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            convert_system_message_to_human=True
        )
        
        # Build the system prompt dynamically from MCP schemas
        system_prompt = get_campaign_agent_prompt()
        logger.debug(f"Generated system prompt ({len(system_prompt)} chars)")
        
        # Create the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create the agent with tool calling capability
        self.agent = create_tool_calling_agent(
            llm=self.llm,
            tools=ALL_TOOLS,
            prompt=self.prompt
        )
        
        # Create the executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=ALL_TOOLS,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10,  # Prevent infinite loops
            return_intermediate_steps=False
        )
        
        logger.info(f"Campaign agent initialized with {len(ALL_TOOLS)} tools")
    
    def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return agent response.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Convert conversation history to LangChain message format
            chat_history = []
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    
                    if role == "user":
                        chat_history.append(HumanMessage(content=content))
                    elif role == "assistant":
                        chat_history.append(AIMessage(content=content))
            
            logger.info(f"Processing message with {len(chat_history)} history items")
            
            # Execute agent
            result = self.agent_executor.invoke({
                "input": message,
                "chat_history": chat_history
            })
            
            response_text = result.get("output", "I apologize, but I couldn't process that request.")
            
            return {
                "success": True,
                "message": response_text,
                "response": response_text
            }
            
        except Exception as e:
            logger.exception(f"Error in agent chat: {str(e)}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}",
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
