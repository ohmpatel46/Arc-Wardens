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
# Gmail Tools - Email Operations
# =============================================================================

GMAIL_SEND_EMAIL = {
    "name": "gmail_send_email",
    "description": "Send a single email via Gmail. Use for individual outreach, follow-ups, or one-off communications. Email is sent immediately upon execution.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "Recipient email address (or comma-separated list for multiple recipients)"
            },
            "subject": {
                "type": "string",
                "description": "Email subject line"
            },
            "body": {
                "type": "string",
                "description": "Email body content (plain text or HTML)"
            },
            "cc": {
                "type": "string",
                "description": "CC recipients (comma-separated email addresses)"
            },
            "bcc": {
                "type": "string",
                "description": "BCC recipients (comma-separated email addresses)"
            },
            "is_html": {
                "type": "boolean",
                "default": False,
                "description": "Whether the body content is HTML (default: false for plain text)"
            }
        },
        "required": ["to", "subject", "body"]
    },
    "sideEffects": "SENDS EMAIL IMMEDIATELY. Cannot be undone. Confirm with user before executing.",
    "category": "email_operations",
    "costInfo": "Subject to Gmail sending limits"
}

GMAIL_SEND_BULK_EMAILS = {
    "name": "gmail_send_bulk_emails",
    "description": "Send bulk emails to multiple recipients using a template. Use for campaign outreach to a list of contacts. Supports personalization placeholders like {name}, {company}.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "recipients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "email": {"type": "string"},
                        "name": {"type": "string"},
                        "company": {"type": "string"}
                    },
                    "required": ["email"]
                },
                "description": "List of recipient objects with email and optional personalization fields"
            },
            "subject": {
                "type": "string",
                "description": "Email subject line (can include {name}, {company} placeholders)"
            },
            "body_template": {
                "type": "string",
                "description": "Email body template with placeholders like {name}, {company} for personalization"
            },
            "is_html": {
                "type": "boolean",
                "default": False,
                "description": "Whether the body template is HTML"
            },
            "delay_seconds": {
                "type": "integer",
                "default": 2,
                "minimum": 1,
                "maximum": 60,
                "description": "Delay between emails in seconds to avoid rate limits (default: 2)"
            }
        },
        "required": ["recipients", "subject", "body_template"]
    },
    "sideEffects": "SENDS MULTIPLE EMAILS. Cannot be undone. Always confirm recipient count and preview content with user first.",
    "category": "email_operations",
    "costInfo": "Subject to Gmail sending limits (500/day for regular, 2000/day for Workspace)"
}

GMAIL_CREATE_DRAFT = {
    "name": "gmail_create_draft",
    "description": "Create an email draft in Gmail without sending it. Use when user wants to prepare an email for review before sending, or save a template.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "Recipient email address"
            },
            "subject": {
                "type": "string",
                "description": "Email subject line"
            },
            "body": {
                "type": "string",
                "description": "Email body content"
            },
            "cc": {
                "type": "string",
                "description": "CC recipients (comma-separated)"
            },
            "bcc": {
                "type": "string",
                "description": "BCC recipients (comma-separated)"
            },
            "is_html": {
                "type": "boolean",
                "default": False,
                "description": "Whether the body content is HTML"
            }
        },
        "required": ["to", "subject", "body"]
    },
    "sideEffects": "Creates a draft in Gmail. Does NOT send the email.",
    "category": "email_operations",
    "costInfo": "No cost"
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
# Tool Registry - All tools organized by category
# =============================================================================

ALL_TOOL_SCHEMAS: List[Dict[str, Any]] = [
    # Lead Generation
    APOLLO_SEARCH_PEOPLE,
    FILTER_CONTACTS_BY_COMPANY_CRITERIA,
    # Email Operations
    GMAIL_SEND_EMAIL,
    GMAIL_SEND_BULK_EMAILS,
    GMAIL_CREATE_DRAFT,
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
        "display_name": "Email Operations (Gmail)",
        "description": "Send emails and manage drafts",
        "tools": ["gmail_send_email", "gmail_send_bulk_emails", "gmail_create_draft"]
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
