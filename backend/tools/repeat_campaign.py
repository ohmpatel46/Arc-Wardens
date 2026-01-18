"""
Repeat campaign action tool - Repeats a previous campaign action.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
import logging
import json

logger = logging.getLogger(__name__)


class RepeatCampaignInput(BaseModel):
    campaign_id: str = Field(description="ID of the campaign to repeat")
    action: str = Field(description="Action to repeat: send_emails, update_sheet, etc.")


def repeat_campaign_action(campaign_id: str, action: str) -> str:
    """
    Repeats a previous campaign action.
    
    Args:
        campaign_id: ID of the campaign to repeat
        action: Action to repeat (send_emails, update_sheet, etc.)
        
    Returns:
        JSON string with results
    """
    # Placeholder implementation
    logger.info(f"Repeat campaign action: {campaign_id}, action: {action}")
    return json.dumps({
        "status": "success",
        "message": f"Repeating action {action} for campaign {campaign_id}",
        "data": {}
    })


RepeatCampaignTool = StructuredTool.from_function(
    func=repeat_campaign_action,
    name="repeat_campaign_action",
    description="Repeat a previous campaign action. Use this when the user wants to re-run a campaign or repeat a specific action from a previous campaign.",
    args_schema=RepeatCampaignInput
)
