"""
Tool Registry - Maps MCP schemas to LangChain tool implementations.
Bridges the gap between MCP-style definitions and LangChain execution.
"""

from typing import Dict, Any, Callable, List
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model
from typing import Optional
import logging
import json


from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import logging
import json
import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from .schema import ALL_TOOL_SCHEMAS, get_tool_by_name

logger = logging.getLogger(__name__)

TARGET_EMAILS = [
    "thevoiceprecis@gmail.com", # Added a real-ish looking test emai
    "panopticnotes@gmail.com"
]

logger = logging.getLogger(__name__)

# =============================================================================
# Tool Execution Functions
# =============================================================================


class GmailToolInput(BaseModel):
    action: str = Field(description="Action to perform: send, draft, list, etc.")
    params: str = Field(description="JSON string of parameters including to, subject, body, and access_token")

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






def execute_apollo_search_people(
    query: str = "",
    person_titles: Optional[List[str]] = None,
    person_locations: Optional[List[str]] = None,
    person_seniorities: Optional[List[str]] = None,
    limit: int = 25,
    # Extra parameters for DB integration
    campaign_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> str:
    """Execute Apollo people search."""
    logger.info(f"Apollo search_people: query={query}, campaign_id={campaign_id}")
    
    import os
    import requests
    import json
    
    apollo_api_key = os.getenv('APOLLO_API_KEY')
    fetched_contacts = []
    
    if apollo_api_key:
        try:
            url = "https://api.apollo.io/api/v1/contacts/search"
            headers = {
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                "accept": "application/json",
                "x-api-key": apollo_api_key
            }
            # Currently we are using a simple default search, but we could use the params
            data = {
                "sort_ascending": False,
                "per_page": 100,
                "q_organization_domains": query if query else None
            }
            
            logger.info("Fetching contacts from Apollo API...")
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                api_data = response.json()
                raw_contacts = api_data.get('contacts', [])
                
                allowed_keys = [
                    "name", "linkedin_url", "title", "organization_name", 
                    "headline", "present_raw_address", "city", "state", 
                    "country", "postal_code", "time_zone", "email"
                ]
                
                for c in raw_contacts:
                    # Filter keys
                    filtered = {k: c.get(k) for k in allowed_keys}
                    fetched_contacts.append(filtered)
                        
                logger.info(f"Successfully fetched {len(fetched_contacts)} contacts from Apollo")

                # SAVE TO DB IF CAMPAIGN ID PRESENT
                if campaign_id and user_id and fetched_contacts:
                    try:
                        from core.db import update_campaign
                        logger.info(f"Saving {len(fetched_contacts)} contacts to campaign {campaign_id}")
                        update_campaign(campaign_id, user_id, contacts=json.dumps(fetched_contacts))
                    except Exception as e:
                        logger.error(f"Failed to save contacts to DB: {e}")

            else:
                logger.error(f"Apollo API failed: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Error calling Apollo API: {str(e)}")
    else:
            logger.warning("APOLLO_API_KEY not set in .env")

    return json.dumps({
        "status": "success",
        "message": "Apollo search completed",
        "results": fetched_contacts,
        "count": len(fetched_contacts)
    })

# ... existing gmail_tool signature ...
def gmail_tool(action: str, params: str) -> str:
    """
    Gmail tool for sending emails and managing email campaigns.
    
    Args:
        action: Action to perform (send, draft, list, etc.)
        params: JSON string of parameters
        
    Returns:
        JSON string with results
    """
    try:
        params_dict = json.loads(params) if isinstance(params, str) else params
    except:
        params_dict = {}

    access_token = params_dict.get('access_token')
    
    if action == "send_to_list":
        if not access_token:
            return json.dumps({"status": "error", "message": "Access token is required for Gmail actions"})
        
        subject = params_dict.get('subject', 'Test Campaign Title')
        body = params_dict.get('body', 'This is a test body for our automated campaign.')
        
        # --- CALL SEPARATED APOLLO FUNCTION ---
        campaign_id = params_dict.get('campaign_id')
        user_id = params_dict.get('user_id')
        
        fetched_contacts = []
        fetched_emails = []
        
        try:
             # Call the now separate Apollo tool
             apollo_res_str = execute_apollo_search_people(
                 query="", # Default or extract from params if needed
                 campaign_id=campaign_id,
                 user_id=user_id
             )
             apollo_res = json.loads(apollo_res_str)
             if apollo_res.get("status") == "success":
                 fetched_contacts = apollo_res.get("results", [])
                 # Extract emails for logging/count (remember we DON'T send to them)
                 fetched_emails = [c.get("email") for c in fetched_contacts if c.get("email")]
        except Exception as e:
            logger.error(f"Error calling execute_apollo_search_people: {e}")

        # --- REAL SENDING LOGIC (RESTRICTED TO TEST EMAILS ONLY) ---
        # CRITICAL: ONLY send to TARGET_EMAILS. Do NOT send to fetched Apollo contacts.
        # We still fetch Apollo contacts for DB saving and logging, but we filter the actual send list.
        target_list = TARGET_EMAILS
        
        logger.info(f"Targeting {len(target_list)} recipients (MANUAL TEST LIST ONLY). Ignoring {len(fetched_emails)} Apollo contacts for safety.")
        
        results = []
        sent_count = 0
        
        for email in target_list:
            try:
                # Add a small delay to avoid rate limits
                import time
                time.sleep(0.5) 
                
                # --- ADD RESPONSE LINK ---
                response_link = f"http://localhost:3000/customerResponse?email={email}"
                if campaign_id:
                    response_link += f"&campaignId={campaign_id}"
                
                modified_body = body + f"\n\n---\nReply specifically to this campaign here: {response_link}"
                # -------------------------

                logger.info(f"Sending email to {email}...")
                send_res = send_gmail(email, subject, modified_body, access_token)
                results.append({"email": email, "result": send_res})
                
                if send_res.get('status') == 'success':
                    sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to {email}: {e}")
                results.append({"email": email, "result": {"status": "error", "message": str(e)}})

        # Update analytics if we have campaign context
        campaign_id = params_dict.get('campaign_id')
        if campaign_id:
             try:
                 from core.db import create_or_update_analytics
                 create_or_update_analytics(campaign_id, emails_sent=sent_count)
             except Exception as e:
                 logger.error(f"Failed to update analytics: {e}")

        return json.dumps({
            "status": "success",
            "message": f"Sent {sent_count}/{len(target_list)} emails successfully.",
            "results": results,
            "apollo_contacts": fetched_contacts
        })

    elif action == "send":
        if not access_token:
            return json.dumps({"status": "error", "message": "Access token is required for Gmail actions"})
        
        to = params_dict.get('to')
        subject = params_dict.get('subject', 'Test Title')
        body = params_dict.get('body', 'Test Body')
        
        if not to:
             return json.dumps({"status": "error", "message": "Recipient 'to' is required"})
             
        res = send_gmail(to, subject, body, access_token)
        return json.dumps(res)

    logger.info(f"Gmail tool called with action: {action}, params: {params_dict}")
    return json.dumps({
        "status": "success",
        "message": f"Action '{action}' not fully implemented or recognized.",
        "data": {}
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
    
    from core.context import current_token_var
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    import base64
    from email.mime.text import MIMEText
    
    access_token = current_token_var.get()
    
    if not access_token:
        logger.error("No access token found in context")
        return json.dumps({
            "status": "error",
            "message": "Authentication required. Please sign in with Google to send emails."
        })

    try:
        creds = Credentials(access_token)
        service = build('gmail', 'v1', credentials=creds)

        message = MIMEText(body, 'html' if is_html else 'plain')
        message['to'] = to
        message['subject'] = subject
        
        if cc:
            message['cc'] = cc
        if bcc:
            message['bcc'] = bcc
        
        # Create the raw message string
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        return json.dumps({
            "status": "success",
            "message": f"Email sent successfully to {to}",
            "message_id": send_result.get('id'),
            "thread_id": send_result.get('threadId'),
            "to": to,
            "subject": subject
        })
    except Exception as e:
        logger.error(f"Error sending Gmail: {str(e)}")
        return json.dumps({
            "status": "error",
            "message": f"Failed to send email: {str(e)}"
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


def send_gmail(to: str, subject: str, body: str, access_token: str) -> Dict[str, Any]:
    """Sends an email using the Gmail API with the provided access token."""
    try:
        creds = Credentials(access_token)
        service = build('gmail', 'v1', credentials=creds)

        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        
        # Create the raw message string
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        return {
            "status": "success",
            "messageId": send_result.get('id'),
            "threadId": send_result.get('threadId')
        }
    except Exception as e:
        logger.error(f"Error sending Gmail: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


# =============================================================================
# Tool Function Registry
# =============================================================================

TOOL_EXECUTORS: Dict[str, Callable] = {
    "apollo_search_people": execute_apollo_search_people,
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




# Export the tools for use in the agent
ALL_TOOLS = create_all_langchain_tools()


GmailTool = StructuredTool.from_function(
    func=gmail_tool,
    name="gmail_tool",
    description="Gmail tool for sending emails. Actions: 'send_to_list' (sends to predefined email list) and 'send' (sends to a specific email). Requires 'access_token' in params.",
    args_schema=GmailToolInput
)

