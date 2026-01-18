"""
Tools module for the campaign agent.
All tools are defined here and exported for use by the agent.
"""

from .intent_routing import IntentRoutingTool, IntentRoutingInput
from .apollo_tool import ApolloTool, ApolloToolInput
from .sheets_tool import SheetsTool, SheetsToolInput
from .gmail_tool import GmailTool, GmailToolInput
from .clarification import AskClarificationTool, AskClarificationInput
from .repeat_campaign import RepeatCampaignTool, RepeatCampaignInput

__all__ = [
    "IntentRoutingTool",
    "IntentRoutingInput",
    "ApolloTool",
    "ApolloToolInput",
    "SheetsTool",
    "SheetsToolInput",
    "GmailTool",
    "GmailToolInput",
    "AskClarificationTool",
    "AskClarificationInput",
    "RepeatCampaignTool",
    "RepeatCampaignInput",
]

# List of all tools for easy import
ALL_TOOLS = [
    IntentRoutingTool,
    ApolloTool,
    SheetsTool,
    GmailTool,
    AskClarificationTool,
    RepeatCampaignTool,
]
