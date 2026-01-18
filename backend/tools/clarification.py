"""
Ask for clarification tool - Asks user for clarification when intent is unclear.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


class AskClarificationInput(BaseModel):
    question: str = Field(description="Question to ask the user for clarification")
    context: str = Field(description="Context about what needs clarification")


def ask_for_clarification(question: str, context: str) -> str:
    """
    Asks the user for clarification when intent is unclear.
    
    Args:
        question: Question to ask the user
        context: Context about what needs clarification
        
    Returns:
        Formatted clarification request
    """
    # Placeholder implementation
    logger.info(f"Ask for clarification: {question}, context: {context}")
    return f"I need some clarification: {question}\n\nContext: {context}"


AskClarificationTool = StructuredTool.from_function(
    func=ask_for_clarification,
    name="ask_for_clarification",
    description="Ask the user for clarification when their intent is unclear or more information is needed. Use this when you need to understand what the user wants before taking action.",
    args_schema=AskClarificationInput
)
