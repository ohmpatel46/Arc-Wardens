"""
Tool Registry - Maps MCP schemas to LangChain tool implementations.
Bridges the gap between MCP-style definitions and LangChain execution.
"""

from typing import Dict, Any, Callable, List, Optional
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model
import logging
import json
import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from .schema import ALL_TOOL_SCHEMAS, get_tool_by_name

logger = logging.getLogger(__name__)

TARGET_EMAILS = [
    "ohmpatel46@gmail.com",
    "aditysoni9727@gmail.com"
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
    failed_tools = []
    for schema in ALL_TOOL_SCHEMAS:
        try:
            tool = create_langchain_tool(schema)
            tools.append(tool)
            logger.info(f"Created LangChain tool: {schema['name']}")
        except Exception as e:
            logger.error(f"Failed to create tool {schema['name']}: {e}", exc_info=True)
            failed_tools.append(schema['name'])
    
    if failed_tools:
        logger.warning(f"Failed to create {len(failed_tools)} tools: {failed_tools}")
    
    logger.info(f"Successfully created {len(tools)}/{len(ALL_TOOL_SCHEMAS)} tools")
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
    """
    Execute Apollo people search.
    NOTE: Free tier Apollo API doesn't support filters, so we fetch all contacts.
    Filtering is done post-API call using Gemini.
    """
    logger.info(f"Apollo search_people: Fetching all contacts (free tier - no filters supported)")
    
    import os
    import requests
    import json
    
    apollo_api_key = os.getenv('APOLLO_API_KEY')
    fetched_contacts = []
    
    if not apollo_api_key:
        logger.warning("APOLLO_API_KEY not set in .env")
        return json.dumps({
            "status": "error",
            "message": "Apollo API key not configured",
            "results": [],
            "count": 0
        })
    
    try:
        url = "https://api.apollo.io/api/v1/contacts/search"
        headers = {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "accept": "application/json",
            "x-api-key": apollo_api_key
        }
        # Free tier: Simple request to get all contacts (no filters supported)
        data = {
            "sort_ascending": False
        }
        
        logger.info("Fetching all contacts from Apollo API (free tier - no filters)...")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            api_data = response.json()
            raw_contacts = api_data.get('contacts', [])
            
            allowed_keys = [
                "name", "linkedin_url", "title", "organization_name", 
                "headline", "present_raw_address", "city", "state", 
                "country", "postal_code", "time_zone", "email", "id"
            ]
            
            for c in raw_contacts:
                # Filter keys and include id for tracking
                filtered = {k: c.get(k) for k in allowed_keys if k in c}
                fetched_contacts.append(filtered)
                    
            logger.info(f"Successfully fetched {len(fetched_contacts)} contacts from Apollo")
            logger.info(f"Note: Filters (person_titles={person_titles}, person_locations={person_locations}, person_seniorities={person_seniorities}) will be applied post-API using Gemini")

        else:
            logger.error(f"Apollo API failed: {response.status_code} - {response.text}")
            return json.dumps({
                "status": "error",
                "message": f"Apollo API error: {response.status_code}",
                "results": [],
                "count": 0
            })
    except Exception as e:
        logger.error(f"Error calling Apollo API: {str(e)}")
        return json.dumps({
            "status": "error",
            "message": str(e),
            "results": [],
            "count": 0
        })

    return json.dumps({
        "status": "success",
        "message": "Apollo search completed. Contacts will be filtered based on your criteria.",
        "results": fetched_contacts,
        "count": len(fetched_contacts)
    })


def execute_filter_contacts_by_company_criteria(
    contacts: List[Dict[str, Any]],
    user_prompt: str,
    campaign_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> str:
    """Filter contacts by company criteria using Gemini AI."""
    import os
    import json
    from langchain_google_genai import ChatGoogleGenerativeAI
    
    # Handle case where contacts might come as JSON string (from LangChain)
    if isinstance(contacts, str):
        try:
            contacts = json.loads(contacts)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse contacts as JSON: {contacts[:100]}")
            return json.dumps({
                "status": "error",
                "message": "Invalid contacts format",
                "results": [],
                "count": 0
            })
    
    logger.info(f"Filtering {len(contacts)} contacts by criteria from user prompt: {user_prompt[:100]}...")
    
    if not contacts:
        return json.dumps({
            "status": "success",
            "message": "No contacts to filter",
            "results": [],
            "count": 0,
            "original_count": 0
        })
    
    try:
        # Prepare company data for Gemini with index-based IDs
        # (Apollo free tier doesn't return contact IDs, so we use index)
        company_data = []
        for idx, contact in enumerate(contacts):
            company_info = {
                "index": idx,  # Use index as unique identifier
                "contact_name": contact.get("name", ""),
                "contact_email": contact.get("email", ""),
                "contact_title": contact.get("title", ""),
                "organization_name": contact.get("organization_name", ""),
                "headline": contact.get("headline", ""),
                "city": contact.get("city", ""),
                "state": contact.get("state", ""),
                "country": contact.get("country", "")
            }
            company_data.append(company_info)
        
        # Create prompt for Gemini
        prompt = f"""You are analyzing a list of contacts to filter them based on specific criteria from a user's request.

User's Request: "{user_prompt}"

Contact/Company Data (each contact has an "index" field for identification):
{json.dumps(company_data, indent=2)}

Task: Analyze EACH contact and determine if they match ALL criteria mentioned in the user's request.

IMPORTANT - Check ALL relevant criteria including:
1. **Job Title**: If the user mentions job roles (e.g., "software engineers", "CTOs", "HR managers"), ONLY include contacts whose contact_title or headline matches that role. Be VERY STRICT:
   - "Human Resources Manager" is NOT a "software engineer"
   - "Head - Data Science" is NOT a "software engineer" (it's data science, not software engineering)
   - "Tech Lead" or "Software Development Engineer" or "Principal Engineer" ARE software engineers
   
2. **Location**: If the user mentions a city/region (e.g., "in Bengaluru", "based in Delhi"), ONLY include contacts whose city EXACTLY matches. Be STRICT:
   - "Hyderabad" is NOT "Bengaluru"  
   - "New Delhi" or "Delhi" is NOT "Bengaluru"
   - Only "Bengaluru" matches "Bengaluru"

3. **Company Type**: If the user mentions company criteria (e.g., "Fortune 500", "Series C startups", "AI companies"), filter accordingly.

4. **Seniority**: If mentioned (e.g., "senior engineers", "entry level"), filter by seniority indicators in the title.

For the request "{user_prompt}":
- Extract the job title criteria (if any)
- Extract the location criteria (if any)  
- Extract any company criteria (if any)
- A contact MUST match ALL specified criteria to be included

Return ONLY a JSON array of index numbers (integers) that match ALL the criteria. If no contacts match, return an empty array: []

Format: [0, 3, 7, 12]

BE VERY STRICT: Only return contacts that genuinely match ALL criteria. Do not include contacts with unrelated job titles or wrong locations.
"""
        
        # Call Gemini (use model from env var or default)
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=0.1,  # Low temperature for consistent filtering
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
        
        response = llm.invoke(prompt)
        response_text = response.content.strip()
        
        # Log raw response for debugging
        logger.info(f"Gemini filter response (raw): {response_text[:500]}...")
        
        # Parse response (handle markdown code blocks if present)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Extract JSON array
        try:
            matched_ids = json.loads(response_text)
            if not isinstance(matched_ids, list):
                logger.warning(f"Gemini returned non-list: {type(matched_ids)}")
                matched_ids = []
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error: {e}. Trying regex extraction...")
            # Try to extract array from text
            import re
            array_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if array_match:
                matched_ids = json.loads(array_match.group())
            else:
                logger.error(f"Could not extract array from response: {response_text}")
                matched_ids = []
        
        logger.info(f"Gemini identified {len(matched_ids)} matching contact indices: {matched_ids[:10]}...")
        
        # Convert to set of integers for index-based matching
        matched_indices = set()
        for idx in matched_ids:
            try:
                matched_indices.add(int(idx))
            except (ValueError, TypeError):
                logger.warning(f"Invalid index value: {idx}")
        
        logger.info(f"Valid matched indices: {len(matched_indices)}")
        
        # Filter contacts by index
        filtered_contacts = [
            contacts[idx] for idx in matched_indices 
            if idx < len(contacts)
        ]
        
        # Log filtered results with sample names
        logger.info(f"Filtered {len(contacts)} contacts to {len(filtered_contacts)} matching criteria")
        logger.info(f"Filter criteria: {user_prompt}")
        if filtered_contacts:
            sample_matches = [f"{c.get('name')} - {c.get('title')} ({c.get('city')})" for c in filtered_contacts[:5]]
            logger.info(f"Sample matches: {sample_matches}")
        logger.info(f"Filtered contact names: {[c.get('name', 'Unknown') for c in filtered_contacts[:10]]}")
        if len(filtered_contacts) > 10:
            logger.info(f"... and {len(filtered_contacts) - 10} more")
        
        # Save filtered contacts to DB
        if campaign_id and user_id and filtered_contacts:
            try:
                from core.db import update_campaign
                logger.info(f"Saving {len(filtered_contacts)} filtered contacts to campaign {campaign_id}")
                update_campaign(campaign_id, user_id, contacts=json.dumps(filtered_contacts))
            except Exception as e:
                logger.error(f"Failed to save filtered contacts to DB: {e}")
        
        return json.dumps({
            "status": "success",
            "message": f"Filtered contacts by criteria from user prompt",
            "results": filtered_contacts,
            "count": len(filtered_contacts),
            "original_count": len(contacts),
            "criteria": user_prompt
        })
    
    except Exception as e:
        logger.error(f"Error filtering contacts with Gemini: {str(e)}")
        # Fallback: return all contacts if filtering fails
        logger.warning("Filtering failed, returning all contacts as fallback")
        return json.dumps({
            "status": "error",
            "message": f"Filtering failed: {str(e)}. Returning all contacts.",
            "results": contacts,
            "count": len(contacts),
            "original_count": len(contacts)
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
        body_template = params_dict.get('body', 'This is a test body for our automated campaign.')
        
        # Get recipients list (filtered contacts from previous step)
        recipients = params_dict.get('recipients', [])
        campaign_id = params_dict.get('campaign_id')
        user_id = params_dict.get('user_id')
        
        # If no recipients provided, fall back to fetching from Apollo (backward compatibility)
        if not recipients:
            logger.info("No recipients provided, fetching from Apollo...")
            try:
                apollo_res_str = execute_apollo_search_people(
                    query="",
                    campaign_id=campaign_id,
                    user_id=user_id
                )
                apollo_res = json.loads(apollo_res_str)
                if apollo_res.get("status") == "success":
                    recipients = apollo_res.get("results", [])
            except Exception as e:
                logger.error(f"Error calling execute_apollo_search_people: {e}")
        
        # --- REAL SENDING LOGIC (RESTRICTED TO TEST EMAILS ONLY) ---
        # CRITICAL: ONLY send to TARGET_EMAILS. Do NOT send to recipients list.
        # We use recipients list for personalization, but send to test emails only.
        target_list = TARGET_EMAILS
        
        logger.info(f"Targeting {len(target_list)} test recipients. Using {len(recipients)} contacts for personalization.")
        
        results = []
        sent_count = 0
        
        # Get user details for signature from params or context (OAuth user data)
        user_name = params_dict.get('user_name')
        user_email = params_dict.get('user_email')
        
        # Fallback to context if not in params
        if not user_name or not user_email:
            try:
                from core.context import current_user_var
                user_data = current_user_var.get()
                if user_data:
                    user_name = user_name or user_data.get('name', 'Arc Wardens Team')
                    user_email = user_email or user_data.get('email', '')
            except:
                pass
        
        # Final fallback
        user_name = user_name or "Arc Wardens Team"
        user_email = user_email or ""
        
        # Personalize emails using recipient data (even though we send to test emails)
        # Use first recipient's data for personalization, or generic if no recipients
        personalization_data = recipients[0] if recipients else {}
        
        for email in target_list:
            try:
                # Personalize email body and subject with recipient data
                personalized_body = body_template
                personalized_subject = subject
                
                # Replace placeholders with actual data from recipients
                name = personalization_data.get("name", "")
                company = personalization_data.get("organization_name", "")
                title = personalization_data.get("title", "")
                
                personalized_body = personalized_body.replace("{name}", name)
                personalized_body = personalized_body.replace("{company}", company)
                personalized_body = personalized_body.replace("{title}", title)
                personalized_subject = personalized_subject.replace("{name}", name)
                personalized_subject = personalized_subject.replace("{company}", company)
                
                # Add signature with user details
                signature = f"\n\n---\n{user_name}"
                if user_email:
                    signature += f"\n{user_email}"
                signature += "\nArc Wardens"
                
                # Add a small delay to avoid rate limits
                import time
                time.sleep(0.5) 
                
                # --- ADD RESPONSE LINK ---
                response_link = f"http://localhost:3000/customerResponse?email={email}"
                if campaign_id:
                    response_link += f"&campaignId={campaign_id}"
                
                modified_body = personalized_body + signature + f"\n\nReply specifically to this campaign here: {response_link}"
                # -------------------------

                logger.info(f"Sending personalized email to {email} (using data from {name} at {company})...")
                send_res = send_gmail(email, personalized_subject, modified_body, access_token)
                results.append({"email": email, "result": send_res})
                
                if send_res.get('status') == 'success':
                    sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to {email}: {e}")
                results.append({"email": email, "result": {"status": "error", "message": str(e)}})

        # Update analytics if we have campaign context
        if campaign_id:
             try:
                 from core.db import create_or_update_analytics
                 create_or_update_analytics(campaign_id, emails_sent=sent_count)
             except Exception as e:
                 logger.error(f"Failed to update analytics: {e}")

        return json.dumps({
            "status": "success",
            "message": f"Sent {sent_count}/{len(target_list)} emails successfully (to test emails only).",
            "results": results,
            "recipients_used_for_personalization": len(recipients),
            "note": "Emails sent to test addresses only, not to actual recipients"
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
    modified_params: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> str:
    """Execute repeat campaign action by replaying saved tool calls."""
    logger.info(f"Repeat campaign action: campaign_id={campaign_id}, action_type={action_type}")
    
    try:
        from core.db import get_db_connection
        import json as json_lib
        
        # Get campaign tool calls
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT tool_calls, contacts FROM campaigns WHERE id = ?', (campaign_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row or not row[0]:
            return json.dumps({
                "status": "error",
                "message": f"No saved workflow found for campaign {campaign_id}"
            })
        
        tool_calls = json_lib.loads(row[0]) if row[0] else []
        contacts = json_lib.loads(row[1]) if row[1] else []
        
        if not tool_calls:
            return json.dumps({
                "status": "error",
                "message": "No tool calls found in campaign workflow"
            })
        
        # Filter tool calls by action_type if specified
        if action_type:
            # Map action_type to tool names
            action_to_tool = {
                "search_leads": "apollo_search_people",
                "filter_contacts": "filter_contacts_by_company_criteria",
                "send_emails": "gmail_tool"  # Uses gmail_tool with send_to_list action
            }
            target_tool = action_to_tool.get(action_type)
            if target_tool:
                tool_calls = [tc for tc in tool_calls if tc.get("tool_name") == target_tool]
        
        if not tool_calls:
            return json.dumps({
                "status": "error",
                "message": f"No {action_type} actions found in campaign workflow"
            })
        
        # Execute tool calls in sequence
        results = []
        for tool_call in tool_calls:
            tool_name = tool_call.get("tool_name")
            tool_args = tool_call.get("tool_args", {})
            
            # Apply modified params if provided
            if modified_params:
                tool_args.update(modified_params)
            
            # Ensure campaign_id and user_id are set
            if campaign_id and "campaign_id" not in tool_args:
                tool_args["campaign_id"] = campaign_id
            if user_id and "user_id" not in tool_args:
                tool_args["user_id"] = user_id
            
            # Execute the tool
            executor = TOOL_EXECUTORS.get(tool_name)
            if executor:
                try:
                    result = executor(**tool_args)
                    results.append({
                        "tool_name": tool_name,
                        "status": "success",
                        "result": result
                    })
                except Exception as e:
                    logger.error(f"Error executing {tool_name}: {e}")
                    results.append({
                        "tool_name": tool_name,
                        "status": "error",
                        "error": str(e)
                    })
            else:
                results.append({
                    "tool_name": tool_name,
                    "status": "error",
                    "error": f"Tool executor not found for {tool_name}"
                })
        
        return json.dumps({
            "status": "success",
            "message": f"Repeated {len(results)} action(s) from campaign workflow",
            "campaign_id": campaign_id,
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error repeating campaign action: {e}")
        return json.dumps({
            "status": "error",
            "message": f"Failed to repeat campaign action: {str(e)}"
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
    "filter_contacts_by_company_criteria": execute_filter_contacts_by_company_criteria,
    "gmail_send_email": execute_gmail_send_email,
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
        "object": Dict[str, Any],  # Use Dict[str, Any] for objects
    }
    
    python_type = type_mapping.get(json_type, str)
    
    # Handle arrays with items
    if json_type == "array":
        items_schema = schema.get("items", {})
        items_type = items_schema.get("type", "string")
        
        # For objects in arrays, use Dict[str, Any]
        if items_type == "object":
            item_python_type = Dict[str, Any]
        else:
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
    description="Gmail tool for sending emails. Actions: 'send_to_list' (sends to test emails with personalization from recipients list) and 'send' (sends to a specific email). Requires 'access_token' in params. For 'send_to_list', provide 'recipients' array with filtered contacts for personalization.",
    args_schema=GmailToolInput
)

