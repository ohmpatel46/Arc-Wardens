"""
Tool Registry - Maps MCP schemas to LangChain tool implementations.
Bridges the gap between MCP-style definitions and LangChain execution.
"""

from typing import Dict, Any, Callable, List
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field, create_model
from typing import Optional
import logging
import json

from .schema import ALL_TOOL_SCHEMAS, get_tool_by_name

logger = logging.getLogger(__name__)


# =============================================================================
# Tool Execution Functions
# =============================================================================

def execute_apollo_search_people(
    query: str,
    person_titles: Optional[List[str]] = None,
    person_locations: Optional[List[str]] = None,
    person_seniorities: Optional[List[str]] = None,
    limit: int = 25
) -> str:
    """Execute Apollo people search."""
    logger.info(f"Apollo search_people: query={query}, titles={person_titles}, locations={person_locations}, limit={limit}")
    
    # TODO: Implement actual Apollo API call
    return json.dumps({
        "status": "success",
        "message": "Apollo search_people - placeholder implementation",
        "results": [],
        "count": 0,
        "query": query,
        "filters_applied": {
            "titles": person_titles,
            "locations": person_locations,
            "seniorities": person_seniorities
        }
    })


def execute_apollo_search_companies(
    query: str,
    industries: Optional[List[str]] = None,
    employee_count: Optional[str] = None,
    locations: Optional[List[str]] = None,
    limit: int = 25
) -> str:
    """Execute Apollo company search."""
    logger.info(f"Apollo search_companies: query={query}, industries={industries}, employee_count={employee_count}")
    
    # TODO: Implement actual Apollo API call
    return json.dumps({
        "status": "success",
        "message": "Apollo search_companies - placeholder implementation",
        "results": [],
        "count": 0,
        "query": query
    })


def execute_apollo_enrich_person(
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    domain: Optional[str] = None,
    linkedin_url: Optional[str] = None
) -> str:
    """Execute Apollo person enrichment."""
    logger.info(f"Apollo enrich_person: email={email}, name={first_name} {last_name}, domain={domain}")
    
    # TODO: Implement actual Apollo API call
    return json.dumps({
        "status": "success",
        "message": "Apollo enrich_person - placeholder implementation",
        "person": {},
        "lookup_params": {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "domain": domain
        }
    })


def execute_apollo_create_list(name: str, description: Optional[str] = None) -> str:
    """Execute Apollo list creation."""
    logger.info(f"Apollo create_list: name={name}, description={description}")
    
    # TODO: Implement actual Apollo API call
    return json.dumps({
        "status": "success",
        "message": "Apollo create_list - placeholder implementation",
        "list_id": "placeholder_list_id",
        "name": name
    })


def execute_apollo_add_to_list(list_id: str, person_ids: List[str]) -> str:
    """Execute adding contacts to Apollo list."""
    logger.info(f"Apollo add_to_list: list_id={list_id}, person_ids={person_ids}")
    
    # TODO: Implement actual Apollo API call
    return json.dumps({
        "status": "success",
        "message": "Apollo add_to_list - placeholder implementation",
        "list_id": list_id,
        "added_count": len(person_ids)
    })


def execute_sheets_read_range(spreadsheet_id: str, range: str) -> str:
    """Execute Google Sheets read."""
    logger.info(f"Sheets read_range: spreadsheet_id={spreadsheet_id}, range={range}")
    
    # TODO: Implement actual Google Sheets API call
    return json.dumps({
        "status": "success",
        "message": "Sheets read_range - placeholder implementation",
        "data": [],
        "range": range
    })


def execute_sheets_write_range(spreadsheet_id: str, range: str, values: List[List[str]]) -> str:
    """Execute Google Sheets write."""
    logger.info(f"Sheets write_range: spreadsheet_id={spreadsheet_id}, range={range}, rows={len(values)}")
    
    # TODO: Implement actual Google Sheets API call
    return json.dumps({
        "status": "success",
        "message": "Sheets write_range - placeholder implementation",
        "cells_updated": sum(len(row) for row in values),
        "range": range
    })


def execute_sheets_append_rows(spreadsheet_id: str, sheet_name: str, values: List[List[str]]) -> str:
    """Execute Google Sheets append."""
    logger.info(f"Sheets append_rows: spreadsheet_id={spreadsheet_id}, sheet={sheet_name}, rows={len(values)}")
    
    # TODO: Implement actual Google Sheets API call
    return json.dumps({
        "status": "success",
        "message": "Sheets append_rows - placeholder implementation",
        "rows_appended": len(values),
        "sheet": sheet_name
    })


def execute_sheets_update_cell(spreadsheet_id: str, cell: str, value: str) -> str:
    """Execute Google Sheets cell update."""
    logger.info(f"Sheets update_cell: spreadsheet_id={spreadsheet_id}, cell={cell}, value={value}")
    
    # TODO: Implement actual Google Sheets API call
    return json.dumps({
        "status": "success",
        "message": "Sheets update_cell - placeholder implementation",
        "cell": cell
    })


def execute_gmail_send_email(
    to: str,
    subject: str,
    body: str,
    cc: Optional[str] = None,
    bcc: Optional[str] = None,
    is_html: bool = False
) -> str:
    """Execute Gmail send email."""
    logger.info(f"Gmail send_email: to={to}, subject={subject}")
    
    # TODO: Implement actual Gmail API call
    return json.dumps({
        "status": "success",
        "message": "Gmail send_email - placeholder implementation",
        "message_id": "placeholder_msg_id",
        "to": to,
        "subject": subject
    })


def execute_gmail_send_bulk_emails(
    recipients: List[Dict[str, str]],
    subject: str,
    body_template: str,
    is_html: bool = False,
    delay_seconds: int = 2
) -> str:
    """Execute Gmail bulk send."""
    logger.info(f"Gmail send_bulk_emails: recipients={len(recipients)}, subject={subject}")
    
    # TODO: Implement actual Gmail API call
    return json.dumps({
        "status": "success",
        "message": "Gmail send_bulk_emails - placeholder implementation",
        "sent_count": len(recipients),
        "failed_count": 0,
        "subject": subject
    })


def execute_gmail_create_draft(
    to: str,
    subject: str,
    body: str,
    cc: Optional[str] = None,
    bcc: Optional[str] = None,
    is_html: bool = False
) -> str:
    """Execute Gmail draft creation."""
    logger.info(f"Gmail create_draft: to={to}, subject={subject}")
    
    # TODO: Implement actual Gmail API call
    return json.dumps({
        "status": "success",
        "message": "Gmail create_draft - placeholder implementation",
        "draft_id": "placeholder_draft_id",
        "to": to
    })


def execute_ask_for_clarification(
    question: str,
    context: Optional[str] = None,
    options: Optional[List[str]] = None
) -> str:
    """Format a clarification request for the user."""
    logger.info(f"Ask for clarification: question={question}")
    
    response = f"I need some clarification to help you better:\n\n**{question}**"
    
    if context:
        response += f"\n\n_Context: {context}_"
    
    if options:
        response += "\n\nPlease choose from these options:\n"
        for i, opt in enumerate(options, 1):
            response += f"{i}. {opt}\n"
    
    return response


def execute_repeat_campaign_action(
    campaign_id: str,
    action_type: str,
    modified_params: Optional[Dict[str, Any]] = None
) -> str:
    """Execute repeat campaign action."""
    logger.info(f"Repeat campaign action: campaign_id={campaign_id}, action_type={action_type}")
    
    # TODO: Implement actual action repetition logic
    return json.dumps({
        "status": "success",
        "message": f"Repeat {action_type} - placeholder implementation",
        "campaign_id": campaign_id,
        "action_type": action_type,
        "modified_params": modified_params
    })


# =============================================================================
# Tool Function Registry
# =============================================================================

TOOL_EXECUTORS: Dict[str, Callable] = {
    "apollo_search_people": execute_apollo_search_people,
    "apollo_search_companies": execute_apollo_search_companies,
    "apollo_enrich_person": execute_apollo_enrich_person,
    "apollo_create_list": execute_apollo_create_list,
    "apollo_add_to_list": execute_apollo_add_to_list,
    "sheets_read_range": execute_sheets_read_range,
    "sheets_write_range": execute_sheets_write_range,
    "sheets_append_rows": execute_sheets_append_rows,
    "sheets_update_cell": execute_sheets_update_cell,
    "gmail_send_email": execute_gmail_send_email,
    "gmail_send_bulk_emails": execute_gmail_send_bulk_emails,
    "gmail_create_draft": execute_gmail_create_draft,
    "ask_for_clarification": execute_ask_for_clarification,
    "repeat_campaign_action": execute_repeat_campaign_action,
}


# =============================================================================
# Pydantic Schema Generation from JSON Schema
# =============================================================================

def json_schema_to_pydantic_field(name: str, schema: Dict[str, Any], required: bool) -> tuple:
    """Convert a JSON Schema property to a Pydantic field definition."""
    
    json_type = schema.get("type", "string")
    description = schema.get("description", "")
    default = schema.get("default", ... if required else None)
    
    # Map JSON Schema types to Python types
    type_mapping = {
        "string": str,
        "integer": int,
        "number": float,
        "boolean": bool,
        "array": list,
        "object": dict,
    }
    
    python_type = type_mapping.get(json_type, str)
    
    # Handle arrays with items
    if json_type == "array":
        items_type = schema.get("items", {}).get("type", "string")
        item_python_type = type_mapping.get(items_type, str)
        python_type = List[item_python_type]
    
    # Make optional if not required
    if not required:
        python_type = Optional[python_type]
    
    return (python_type, Field(default=default, description=description))


def create_pydantic_model_from_schema(tool_schema: Dict[str, Any]) -> type:
    """Create a Pydantic model from an MCP tool schema."""
    
    input_schema = tool_schema.get("inputSchema", {})
    properties = input_schema.get("properties", {})
    required = input_schema.get("required", [])
    
    fields = {}
    for prop_name, prop_schema in properties.items():
        is_required = prop_name in required
        fields[prop_name] = json_schema_to_pydantic_field(prop_name, prop_schema, is_required)
    
    # Create dynamic Pydantic model
    model_name = f"{tool_schema['name'].title().replace('_', '')}Input"
    return create_model(model_name, **fields)


# =============================================================================
# LangChain Tool Generation
# =============================================================================

def create_langchain_tool(tool_schema: Dict[str, Any]) -> StructuredTool:
    """Create a LangChain StructuredTool from an MCP tool schema."""
    
    tool_name = tool_schema["name"]
    
    # Get the executor function
    executor = TOOL_EXECUTORS.get(tool_name)
    if not executor:
        raise ValueError(f"No executor found for tool: {tool_name}")
    
    # Create Pydantic input schema
    input_model = create_pydantic_model_from_schema(tool_schema)
    
    # Create the LangChain tool
    return StructuredTool.from_function(
        func=executor,
        name=tool_name,
        description=tool_schema["description"],
        args_schema=input_model
    )


def create_all_langchain_tools() -> List[StructuredTool]:
    """Create all LangChain tools from MCP schemas."""
    tools = []
    for schema in ALL_TOOL_SCHEMAS:
        try:
            tool = create_langchain_tool(schema)
            tools.append(tool)
            logger.debug(f"Created LangChain tool: {schema['name']}")
        except Exception as e:
            logger.error(f"Failed to create tool {schema['name']}: {e}")
    return tools


# Export the tools for use in the agent
ALL_TOOLS = create_all_langchain_tools()
