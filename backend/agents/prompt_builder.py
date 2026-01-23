"""
MCP-Style System Prompt Builder.
Dynamically generates system prompts from tool schemas following Model Context Protocol best practices.
"""

from typing import List, Dict, Any
import json


def format_json_schema_params(input_schema: Dict[str, Any]) -> str:
    """Format JSON Schema properties into readable parameter documentation."""
    properties = input_schema.get("properties", {})
    required = input_schema.get("required", [])
    
    if not properties:
        return "  No parameters required."
    
    lines = []
    for name, schema in properties.items():
        # Determine if required
        req_marker = " **(required)**" if name in required else ""
        
        # Get type info
        param_type = schema.get("type", "any")
        if param_type == "array":
            items_type = schema.get("items", {}).get("type", "any")
            param_type = f"array[{items_type}]"
        
        # Get description
        desc = schema.get("description", "No description")
        
        # Get constraints
        constraints = []
        if "enum" in schema:
            constraints.append(f"options: {schema['enum']}")
        if "minimum" in schema:
            constraints.append(f"min: {schema['minimum']}")
        if "maximum" in schema:
            constraints.append(f"max: {schema['maximum']}")
        if "default" in schema:
            constraints.append(f"default: {schema['default']}")
        
        constraint_str = f" ({', '.join(constraints)})" if constraints else ""
        
        lines.append(f"  - `{name}` ({param_type}){req_marker}: {desc}{constraint_str}")
    
    return "\n".join(lines)


def build_tool_documentation(tool_schemas: List[Dict[str, Any]], categories: Dict[str, Any]) -> str:
    """
    Generate comprehensive tool documentation from MCP-style schemas.
    Groups tools by category and includes all relevant information.
    """
    docs = []
    
    # Group tools by category
    tools_by_category = {}
    for tool in tool_schemas:
        cat = tool.get("category", "other")
        if cat not in tools_by_category:
            tools_by_category[cat] = []
        tools_by_category[cat].append(tool)
    
    # Generate documentation for each category
    for cat_key, cat_info in categories.items():
        if cat_key not in tools_by_category:
            continue
            
        docs.append(f"### {cat_info['display_name']}")
        docs.append(f"_{cat_info['description']}_\n")
        
        for tool in tools_by_category[cat_key]:
            params_doc = format_json_schema_params(tool["inputSchema"])
            side_effects = tool.get("sideEffects", "None documented")
            
            docs.append(f"""**`{tool['name']}`**
{tool['description']}

Parameters:
{params_doc}

Side Effects: {side_effects}
""")
    
    return "\n".join(docs)


def build_intent_routing_guide(tool_schemas: List[Dict[str, Any]], categories: Dict[str, Any]) -> str:
    """
    Generate intent routing guidelines based on tool schemas.
    Maps user intent patterns to appropriate tools.
    """
    routing = []
    
    # Define intent patterns for each category
    intent_patterns = {
        "lead_generation": {
            "keywords": ["find", "search", "get", "discover", "look for", "locate", "who are", "list of", "filter"],
            "examples": [
                '"Find me software engineers in Bengaluru" → `apollo_search_people` then `filter_contacts_by_company_criteria`',
                '"Find CTOs at Fortune 500 companies" → `apollo_search_people` then `filter_contacts_by_company_criteria`',
                '"Search for people at AI startups" → `apollo_search_people` then `filter_contacts_by_company_criteria`'
            ]
        },
        "email_operations": {
            "keywords": ["send", "email", "send it", "looks good", "send the email", "send emails", "yes send", "confirm send"],
            "examples": [
                '"Send it" → `gmail_tool` with action "send_to_list" (use filtered contacts and drafted email)',
                '"Yes, send the emails" → `gmail_tool` with action "send_to_list"',
                '"Looks good, send it" → `gmail_tool` with action "send_to_list"'
            ]
        },
    }
    
    routing.append("## Intent Routing Guide\n")
    routing.append("Analyze the user's message and select the appropriate tool based on their intent:\n")
    
    for cat_key, cat_info in categories.items():
        if cat_key not in intent_patterns:
            continue
            
        patterns = intent_patterns[cat_key]
        routing.append(f"### {cat_info['display_name']}")
        routing.append(f"**Trigger Keywords**: {', '.join(patterns['keywords'])}\n")
        routing.append("**Tool Selection**:")
        for example in patterns["examples"]:
            routing.append(f"- {example}")
        routing.append("")
    
    # Add clarification guidance
    routing.append("""### When to Ask for Clarification
Use `ask_for_clarification` when:
- The user's request is ambiguous (e.g., "send the email" - which email? to whom?)
- Required parameters are missing (e.g., no spreadsheet ID provided)
- The action has significant side effects and user hasn't confirmed
- Multiple interpretations are possible

**Never assume** - if critical information is missing, ask first.""")
    
    return "\n".join(routing)


def build_execution_guidelines(high_impact_tools: List[str]) -> str:
    """Generate execution guidelines and best practices."""
    
    return f"""## Execution Guidelines

### 1. Pre-Execution Checks
Before calling any tool:
- Verify all **required** parameters are available
- If parameters are missing, use `ask_for_clarification`
- For high-impact tools, confirm with the user first

### 2. High-Impact Tools (Require User Confirmation)
The following tools have significant side effects. **Always confirm with the user before executing**:
{chr(10).join(f'- `{tool}`' for tool in high_impact_tools)}

### 3. Tool Chaining Patterns
Common workflows that chain multiple tools:

**Lead Generation → Filter → Email Campaign:**
1. `apollo_search_people` - Fetch all contacts from Apollo (free tier returns all contacts)
2. `filter_contacts_by_company_criteria` - Filter contacts by criteria from user's prompt (e.g., "Fortune 500", "Series C startups", "CTOs")
3. Draft email in conversation - Show user email draft with subject and body, iterate until confirmed
4. `gmail_tool` with action "send_to_list" - Send personalized emails (currently sends to test emails only for safety)

**Email Draft Workflow:**
- When user wants to send emails, IMMEDIATELY draft an email based on context (what they told you about their product/service)
- Do NOT ask for subject/body separately - be proactive and create a draft based on the conversation
- **IMPORTANT: Use ACTUAL recipient data from filtered contacts - NOT placeholders!**
- If you have filtered contacts, use the first recipient's name and company in the draft
- Example: If the contact is "Meet Bhalodiya" at "Goldman Sachs", show:
  ---
  **Subject:** Meet, quick question about Goldman Sachs
  
  **Body:**
  Hi Meet,
  
  [Your drafted message here based on what user told you about their product]
  
  Best regards,
  [User's name from OAuth will be added automatically]
  ---
- Ask "Does this look good, or would you like me to adjust anything?"
- Iterate based on feedback until user confirms
- THEN call the gmail_tool with action "send_to_list" - campaign_id and user_id are AUTOMATICALLY provided
- Note: When sending to multiple recipients, the system will automatically personalize each email with that recipient's details

### 4. Error Handling
- If a tool returns an error, explain it clearly to the user
- Suggest alternatives or corrective actions
- Never retry failed operations without user consent

### 5. Response Format
After executing a tool:
1. Summarize what was done
2. Present key results (counts, names, etc.)
3. Suggest logical next steps
4. If action had costs, mention it"""


def build_system_prompt(
    tool_schemas: List[Dict[str, Any]],
    categories: Dict[str, Any],
    high_impact_tools: List[str]
) -> str:
    """
    Build the complete system prompt from tool schemas.
    This is the main entry point for generating MCP-style prompts.
    """
    
    tool_docs = build_tool_documentation(tool_schemas, categories)
    intent_guide = build_intent_routing_guide(tool_schemas, categories)
    execution_guide = build_execution_guidelines(high_impact_tools)
    
    return f"""You are an AI assistant for Arc Wardens, an AI-powered sales outreach automation platform.

Your role is to help users create and manage sales campaigns by intelligently selecting and using the appropriate tools based on their intent.

# Available Tools

{tool_docs}

{intent_guide}

{execution_guide}

## Important Reminders

1. **Be Proactive**: After completing an action, suggest logical next steps
2. **Be Transparent**: Explain what tools you're using and why
3. **Be Cost-Aware**: Inform users when actions may incur costs (API calls, credits)
4. **Be Safe**: Never execute high-impact actions without confirmation
5. **Be Helpful**: If tools return placeholder/mock data, explain what the actual behavior would be

Remember: You have access to powerful tools that can search databases, manage lists, read/write spreadsheets, and send emails. Use them responsibly and always prioritize the user's intent."""


# Convenience function for the agent
def get_campaign_agent_prompt() -> str:
    """Get the fully built system prompt for the campaign agent."""
    from tools.schema import ALL_TOOL_SCHEMAS, TOOL_CATEGORIES, get_high_impact_tools
    
    return build_system_prompt(
        tool_schemas=ALL_TOOL_SCHEMAS,
        categories=TOOL_CATEGORIES,
        high_impact_tools=get_high_impact_tools()
    )
