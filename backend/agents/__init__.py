"""
Agents Module.
MCP-style campaign agent with dynamic prompt generation.
"""

from .campaign_agent import CampaignAgent, get_agent, reset_agent
from .prompt_builder import get_campaign_agent_prompt, build_system_prompt

__all__ = [
    "CampaignAgent",
    "get_agent",
    "reset_agent",
    "get_campaign_agent_prompt",
    "build_system_prompt",
]
