"""
LangChain-based campaign agent.
This is the central agent that handles campaign conversations and tool execution.
"""

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
import os
import logging

from tools import ALL_TOOLS

logger = logging.getLogger(__name__)

# Agent Prompt Template
AGENT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an AI assistant for Arc Wardens, an AI-powered sales outreach automation platform.

Your role is to help users create and manage sales campaigns by:
1. Understanding their intent and routing to appropriate tools
2. Using Apollo API to find and enrich leads
3. Managing campaign data in Google Sheets
4. Sending emails via Gmail
5. Asking for clarification when needed
6. Repeating campaign actions when requested

When a user asks you to do something:
- First, use intent_routing to understand what they want
- Then use the appropriate tool (apollo_tool, sheets_tool, gmail_tool)
- If unclear, ask_for_clarification
- If they want to repeat something, use repeat_campaign_action

Always be helpful, clear, and proactive in suggesting next steps.
When tools are executed, costs will be deducted from the user's wallet automatically."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])


class CampaignAgent:
    """LangChain-based chat agent for campaign management."""
    
    def __init__(self, model_name: str = "gpt-4", temperature: float = 0.7):
        """
        Initialize the campaign agent.
        
        Args:
            model_name: OpenAI model to use
            temperature: Temperature for model responses
        """
        self.llm = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=ALL_TOOLS,
            prompt=AGENT_PROMPT
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=ALL_TOOLS,
            verbose=True,
            handle_parsing_errors=True
        )
        
        logger.info("Campaign agent initialized")
    
    def chat(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
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
                    if msg.get("role") == "user":
                        chat_history.append(HumanMessage(content=msg.get("content", "")))
                    elif msg.get("role") == "assistant":
                        chat_history.append(AIMessage(content=msg.get("content", "")))
            
            # Execute agent
            result = self.agent_executor.invoke({
                "input": message,
                "chat_history": chat_history
            })
            
            response_text = result.get("output", "I apologize, but I couldn't process that request.")
            
            return {
                "success": True,
                "message": response_text,
                "response": response_text,
                "content": response_text
            }
            
        except Exception as e:
            logger.exception(f"Error in agent chat: {str(e)}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}",
                "error": str(e)
            }


# Singleton instance (will be initialized when needed)
_agent_instance: Optional[CampaignAgent] = None


def get_agent() -> CampaignAgent:
    """Get or create the agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = CampaignAgent()
    return _agent_instance
