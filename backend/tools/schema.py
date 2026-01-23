"""
MCP-style Tool Schema Definitions.
Centralized JSON Schema definitions for all tools following Model Context Protocol best practices.

Each tool definition includes:
- name: Unique identifier for the tool
- description: Clear description of what the tool does
- inputSchema: JSON Schema for input validation
- sideEffects: Explicit documentation of any side effects
- category: Grouping for organization and intent routing
- costInfo: Information about potential costs
"""

from typing import List, Dict, Any

# =============================================================================
# Apollo Tools - Lead Generation & Contact Management
# =============================================================================

APOLLO_SEARCH_PEOPLE = {
    "name": "apollo_search_people",
    "description": "Search for people/contacts in Apollo database. Use when user wants to find leads, contacts, or people matching specific criteria like job titles, companies, or locations. Returns a list of matching contacts with their professional information.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language search query (e.g., 'software engineers at Google', 'CTOs in fintech startups')"
            },
            "person_titles": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of job titles to filter by (e.g., ['CEO', 'CTO', 'VP of Sales'])"
            },
            "person_locations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of locations to filter by (e.g., ['New York', 'San Francisco', 'London'])"
            },
            "person_seniorities": {
                "type": "array",
                "items": {"type": "string"},
                "enum": ["entry", "senior", "manager", "director", "vp", "c_suite", "owner", "partner"],
                "description": "List of seniority levels to filter by"
            },
            "limit": {
                "type": "integer",
                "default": 25,
                "minimum": 1,
                "maximum": 100,
                "description": "Maximum number of results to return (default: 25)"
            }
        },
        "required": ["query"]
    },
    "sideEffects": "Makes API call to Apollo. May incur API costs based on usage.",
    "category": "lead_generation",
    "costInfo": "Credits consumed per search based on results returned"
}


# =============================================================================
# Utility Tools
# =============================================================================

ASK_FOR_CLARIFICATION = {
    "name": "ask_for_clarification",
    "description": "Ask the user for clarification when their request is ambiguous, incomplete, or when critical information is missing. Use this instead of making assumptions.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "Clear, specific question to ask the user"
            },
            "context": {
                "type": "string",
                "description": "Brief explanation of why this information is needed"
            },
            "options": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Optional list of choices to present to the user"
            }
        },
        "required": ["question"]
    },
    "sideEffects": "None. This is a communication tool.",
    "category": "utility",
    "costInfo": "No cost"
}

REPEAT_CAMPAIGN_ACTION = {
    "name": "repeat_campaign_action",
    "description": "Repeat a previously executed campaign action. Use when user wants to re-run a search, resend emails, or repeat any previous action with the same or modified parameters.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "campaign_id": {
                "type": "string",
                "description": "ID of the campaign containing the action to repeat"
            },
            "action_type": {
                "type": "string",
                "enum": ["search_leads", "enrich_contacts", "send_emails", "update_sheet", "create_list"],
                "description": "Type of action to repeat"
            },
            "modified_params": {
                "type": "object",
                "description": "Optional modified parameters for the repeated action (overrides original params)"
            }
        },
        "required": ["campaign_id", "action_type"]
    },
    "sideEffects": "Executes the specified action again. Side effects depend on the action type.",
    "category": "utility",
    "costInfo": "Depends on the action being repeated"
}

FILTER_CONTACTS_BY_COMPANY_CRITERIA = {
    "name": "filter_contacts_by_company_criteria",
    "description": "Filter a list of contacts based on company criteria using AI. Use when user specifies company filters like 'Fortune 500', 'Series C startups', 'AI native companies', etc. Analyzes company information from contact data and returns filtered list. Also saves filtered contacts to campaign database.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "contacts": {
                "type": "array",
                "items": {"type": "object"},
                "description": "List of contact objects from Apollo search to filter"
            },
            "user_prompt": {
                "type": "string",
                "description": "The original user prompt containing filtering criteria (e.g., 'Find all CTOs in Fortune 500 companies', 'Series C startups', 'AI native companies')"
            },
            "campaign_id": {
                "type": "string",
                "description": "Campaign ID for saving filtered contacts (optional)"
            },
            "user_id": {
                "type": "string",
                "description": "User ID for campaign ownership verification (optional)"
            }
        },
        "required": ["contacts", "user_prompt"]
    },
    "sideEffects": "Uses Gemini API for filtering. May incur API costs. Saves filtered contacts to campaign database if campaign_id provided.",
    "category": "lead_generation",
    "costInfo": "Gemini API call cost per filter operation"
}

# =============================================================================
# Gmail Tool - Email Sending
# =============================================================================

GMAIL_TOOL = {
    "name": "gmail_tool",
    "description": "Send emails to filtered contacts. Use when the user confirms they want to send emails after reviewing a draft. The email will be personalized with recipient's name and company. In testing mode, emails are only sent to test addresses.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["send_to_list"],
                "description": "Action to perform. Use 'send_to_list' to send emails to the filtered contacts."
            },
            "subject": {
                "type": "string",
                "description": "Email subject line. Can include {name} and {company} placeholders for personalization."
            },
            "body": {
                "type": "string",
                "description": "Email body content. Can include {name}, {company}, and {title} placeholders for personalization."
            },
            "recipients": {
                "type": "array",
                "items": {"type": "object"},
                "description": "List of recipient contacts with their details (name, email, company, title). Usually from filtered contacts."
            },
            "campaign_id": {
                "type": "string",
                "description": "Campaign ID to associate emails with"
            },
            "user_id": {
                "type": "string",
                "description": "User ID for authentication"
            }
        },
        "required": ["action", "subject", "body"]
    },
    "sideEffects": "SENDS REAL EMAILS. In testing mode, only sends to test addresses. Requires user confirmation before use.",
    "category": "email_operations",
    "costInfo": "Gmail API usage, potential rate limits"
}

# =============================================================================
# Tool Registry - All tools organized by category
# =============================================================================

ALL_TOOL_SCHEMAS: List[Dict[str, Any]] = [
    # Lead Generation
    APOLLO_SEARCH_PEOPLE,
    FILTER_CONTACTS_BY_COMPANY_CRITERIA,
    # Email Operations
    GMAIL_TOOL,
    # Utility
    ASK_FOR_CLARIFICATION,
    REPEAT_CAMPAIGN_ACTION,
]

# Category groupings for organization
TOOL_CATEGORIES = {
    "lead_generation": {
        "display_name": "Lead Generation & Search",
        "description": "Find and filter contacts",
        "tools": ["apollo_search_people", "filter_contacts_by_company_criteria"]
    },
    "email_operations": {
        "display_name": "Email Operations",
        "description": "Send and manage email campaigns",
        "tools": ["gmail_tool"]
    },
    "utility": {
        "display_name": "Utility",
        "description": "Helper tools for clarification and automation",
        "tools": ["ask_for_clarification", "repeat_campaign_action"]
    }
}

def get_tool_by_name(name: str) -> Dict[str, Any] | None:
    """Get a tool schema by its name."""
    for tool in ALL_TOOL_SCHEMAS:
        if tool["name"] == name:
            return tool
    return None

def get_tools_by_category(category: str) -> List[Dict[str, Any]]:
    """Get all tool schemas for a specific category."""
    return [tool for tool in ALL_TOOL_SCHEMAS if tool.get("category") == category]

def get_high_impact_tools() -> List[str]:
    """Get list of tool names that have significant side effects and require user confirmation."""
    high_impact = []
    for tool in ALL_TOOL_SCHEMAS:
        side_effects = tool.get("sideEffects", "").lower()
        if any(keyword in side_effects for keyword in ["send", "overwrite", "cannot be undone", "confirm"]):
            high_impact.append(tool["name"])
    return high_impact
