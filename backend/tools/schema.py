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

APOLLO_SEARCH_COMPANIES = {
    "name": "apollo_search_companies",
    "description": "Search for companies in Apollo database. Use when user wants to find companies matching specific criteria like industry, size, or location. Returns a list of matching companies with their information.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language search query (e.g., 'SaaS companies', 'fintech startups in NYC')"
            },
            "industries": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of industries to filter by (e.g., ['Software', 'Financial Services'])"
            },
            "employee_count": {
                "type": "string",
                "enum": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
                "description": "Employee count range to filter by"
            },
            "locations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of locations to filter by"
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
    "sideEffects": "Makes API call to Apollo. May incur API costs.",
    "category": "lead_generation",
    "costInfo": "Credits consumed per search"
}

APOLLO_ENRICH_PERSON = {
    "name": "apollo_enrich_person",
    "description": "Enrich a person's contact information using Apollo. Use when user wants to get more details about a specific contact like email, phone, social profiles. Requires at least an email OR name+domain combination.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "email": {
                "type": "string",
                "format": "email",
                "description": "Email address of the person to enrich"
            },
            "first_name": {
                "type": "string",
                "description": "First name of the person (use with last_name and domain)"
            },
            "last_name": {
                "type": "string",
                "description": "Last name of the person (use with first_name and domain)"
            },
            "domain": {
                "type": "string",
                "description": "Company domain (e.g., 'apollo.io') - use with first_name and last_name"
            },
            "linkedin_url": {
                "type": "string",
                "description": "LinkedIn profile URL for the person"
            }
        },
        "required": []
    },
    "sideEffects": "Makes API call to Apollo. Consumes enrichment credits.",
    "category": "lead_generation",
    "costInfo": "1 enrichment credit per person"
}

APOLLO_CREATE_LIST = {
    "name": "apollo_create_list",
    "description": "Create a new contact list in Apollo for organizing leads. Use when user wants to create a list to group contacts for a campaign or organization.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Name of the list to create (e.g., 'Q1 Outreach Targets')"
            },
            "description": {
                "type": "string",
                "description": "Optional description of the list's purpose"
            }
        },
        "required": ["name"]
    },
    "sideEffects": "Creates a new list in Apollo account.",
    "category": "list_management",
    "costInfo": "No additional cost"
}

APOLLO_ADD_TO_LIST = {
    "name": "apollo_add_to_list",
    "description": "Add contacts to an existing Apollo list. Use when user wants to add found leads or contacts to a list for organization or campaign targeting.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "list_id": {
                "type": "string",
                "description": "ID of the Apollo list to add contacts to"
            },
            "person_ids": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of Apollo person IDs to add to the list"
            }
        },
        "required": ["list_id", "person_ids"]
    },
    "sideEffects": "Modifies an existing list in Apollo.",
    "category": "list_management",
    "costInfo": "No additional cost"
}

# =============================================================================
# Google Sheets Tools - Data Management
# =============================================================================

SHEETS_READ_RANGE = {
    "name": "sheets_read_range",
    "description": "Read data from a specific range in a Google Sheet. Use when user wants to retrieve campaign data, contact lists, or any spreadsheet information.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "Google Sheets spreadsheet ID (found in the sheet URL after /d/)"
            },
            "range": {
                "type": "string",
                "description": "A1 notation range to read (e.g., 'Sheet1!A1:D10' or 'Contacts!A:E')"
            }
        },
        "required": ["spreadsheet_id", "range"]
    },
    "sideEffects": "Read-only. No data modification.",
    "category": "data_management",
    "costInfo": "No cost"
}

SHEETS_WRITE_RANGE = {
    "name": "sheets_write_range",
    "description": "Write or update data in a specific range of a Google Sheet. Use when user wants to save results, update contact information, or modify spreadsheet data. WARNING: Overwrites existing data in the specified range.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "Google Sheets spreadsheet ID"
            },
            "range": {
                "type": "string",
                "description": "A1 notation range to write to (e.g., 'Sheet1!A1:D10')"
            },
            "values": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "description": "2D array of values to write (rows x columns)"
            }
        },
        "required": ["spreadsheet_id", "range", "values"]
    },
    "sideEffects": "OVERWRITES existing data in the specified range. Confirm with user before executing.",
    "category": "data_management",
    "costInfo": "No cost"
}

SHEETS_APPEND_ROWS = {
    "name": "sheets_append_rows",
    "description": "Append new rows to the end of a Google Sheet. Use when user wants to add new contacts, leads, or records without overwriting existing data.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "Google Sheets spreadsheet ID"
            },
            "sheet_name": {
                "type": "string",
                "description": "Name of the sheet/tab to append to (e.g., 'Contacts', 'Sheet1')"
            },
            "values": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "description": "2D array of rows to append (each inner array is a row)"
            }
        },
        "required": ["spreadsheet_id", "sheet_name", "values"]
    },
    "sideEffects": "Adds new rows at the end of the sheet. Does not overwrite existing data.",
    "category": "data_management",
    "costInfo": "No cost"
}

SHEETS_UPDATE_CELL = {
    "name": "sheets_update_cell",
    "description": "Update a single cell in a Google Sheet. Use for targeted updates to specific values.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "Google Sheets spreadsheet ID"
            },
            "cell": {
                "type": "string",
                "description": "A1 notation of the cell to update (e.g., 'Sheet1!B5')"
            },
            "value": {
                "type": "string",
                "description": "Value to write to the cell"
            }
        },
        "required": ["spreadsheet_id", "cell", "value"]
    },
    "sideEffects": "Updates a single cell value.",
    "category": "data_management",
    "costInfo": "No cost"
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

# =============================================================================
# Tool Registry - All tools organized by category
# =============================================================================

ALL_TOOL_SCHEMAS: List[Dict[str, Any]] = [
    # Lead Generation
    APOLLO_SEARCH_PEOPLE,
    APOLLO_SEARCH_COMPANIES,
    APOLLO_ENRICH_PERSON,
    # List Management
    APOLLO_CREATE_LIST,
    APOLLO_ADD_TO_LIST,
    # Data Management
    SHEETS_READ_RANGE,
    SHEETS_WRITE_RANGE,
    SHEETS_APPEND_ROWS,
    SHEETS_UPDATE_CELL,
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
        "description": "Find and enrich contacts and companies",
        "tools": ["apollo_search_people", "apollo_search_companies", "apollo_enrich_person"]
    },
    "list_management": {
        "display_name": "Contact List Management", 
        "description": "Create and manage contact lists",
        "tools": ["apollo_create_list", "apollo_add_to_list"]
    },
    "data_management": {
        "display_name": "Data Management (Google Sheets)",
        "description": "Read and write spreadsheet data",
        "tools": ["sheets_read_range", "sheets_write_range", "sheets_append_rows", "sheets_update_cell"]
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
