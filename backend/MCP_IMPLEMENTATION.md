# MCP-Style Tool Implementation

This document describes the Model Context Protocol (MCP) style implementation of tools in the Arc Wardens campaign agent.

## Architecture Overview

```
backend/
├── agents/
│   ├── __init__.py              # Agent exports
│   ├── campaign_agent.py        # Main agent class (uses dynamic prompt)
│   └── prompt_builder.py        # Dynamic system prompt generation
├── tools/
│   ├── __init__.py              # Tool exports
│   ├── schema.py                # MCP-style JSON Schema definitions (SOURCE OF TRUTH)
│   └── registry.py              # Maps schemas to executors, creates LangChain tools
```

## Core Principles

### 1. Single Source of Truth
All tool definitions live in `tools/schema.py` as JSON Schema objects. This includes:
- Tool name and description
- Input schema with typed parameters
- Side effects documentation
- Category grouping
- Cost information

### 2. Dynamic Prompt Generation
The system prompt is generated automatically from the tool schemas:
- `prompt_builder.py` reads schemas and generates documentation
- Tool selection guidelines are derived from categories
- Intent routing patterns are built from tool metadata
- No manual duplication of tool information

### 3. Separation of Concerns
- **Schema**: Defines WHAT tools do (contract)
- **Registry**: Defines HOW tools execute (implementation)
- **Agent**: Uses tools based on user intent (orchestration)

## Tool Schema Format (MCP-Style)

Each tool is defined as a Python dictionary following this structure:

```python
{
    "name": "tool_name",
    "description": "Clear description of what the tool does and when to use it",
    "inputSchema": {
        "type": "object",
        "properties": {
            "param_name": {
                "type": "string|integer|boolean|array|object",
                "description": "What this parameter does",
                "default": "optional_default",
                "enum": ["optional", "choices"],
                "minimum": 0,
                "maximum": 100
            }
        },
        "required": ["required_params"]
    },
    "sideEffects": "Documentation of any side effects (API calls, data changes, costs)",
    "category": "category_for_grouping",
    "costInfo": "Information about potential costs"
}
```

## Available Tools (14 total)

### Lead Generation (3 tools)
| Tool | Purpose |
|------|---------|
| `apollo_search_people` | Search for contacts by criteria |
| `apollo_search_companies` | Search for companies by criteria |
| `apollo_enrich_person` | Enrich contact information |

### List Management (2 tools)
| Tool | Purpose |
|------|---------|
| `apollo_create_list` | Create a new contact list |
| `apollo_add_to_list` | Add contacts to a list |

### Data Management (4 tools)
| Tool | Purpose |
|------|---------|
| `sheets_read_range` | Read from Google Sheets |
| `sheets_write_range` | Write to Google Sheets |
| `sheets_append_rows` | Append rows to sheet |
| `sheets_update_cell` | Update a single cell |

### Email Operations (3 tools)
| Tool | Purpose |
|------|---------|
| `gmail_send_email` | Send single email |
| `gmail_send_bulk_emails` | Send bulk campaign emails |
| `gmail_create_draft` | Create email draft |

### Utility (2 tools)
| Tool | Purpose |
|------|---------|
| `ask_for_clarification` | Request user clarification |
| `repeat_campaign_action` | Repeat previous action |

## Intent Routing

Intent routing is handled in the system prompt, not via a separate tool. The prompt includes:

1. **Trigger Keywords**: Words that indicate specific intents
2. **Tool Selection Rules**: Clear mapping from intent to tool
3. **Clarification Guidelines**: When to ask vs. when to proceed
4. **Confirmation Requirements**: High-impact actions need user approval

### Example Intent Patterns

```
"Find CTOs in fintech" → apollo_search_people
"Search for SaaS companies" → apollo_search_companies
"Send campaign emails" → gmail_send_bulk_emails
"Save to spreadsheet" → sheets_write_range or sheets_append_rows
```

## Adding New Tools

### Step 1: Define Schema
Add the tool definition to `tools/schema.py`:

```python
NEW_TOOL = {
    "name": "new_tool_name",
    "description": "What the tool does...",
    "inputSchema": {
        "type": "object",
        "properties": {...},
        "required": [...]
    },
    "sideEffects": "...",
    "category": "category_name",
    "costInfo": "..."
}

# Add to ALL_TOOL_SCHEMAS list
ALL_TOOL_SCHEMAS.append(NEW_TOOL)
```

### Step 2: Implement Executor
Add the execution function to `tools/registry.py`:

```python
def execute_new_tool(param1: str, param2: int = 10) -> str:
    """Execute the new tool."""
    # Implementation here
    return json.dumps({"status": "success", ...})

# Add to TOOL_EXECUTORS dict
TOOL_EXECUTORS["new_tool_name"] = execute_new_tool
```

### Step 3: (Optional) Update Categories
If adding a new category, update `TOOL_CATEGORIES` in `schema.py` and intent patterns in `prompt_builder.py`.

That's it! The tool will automatically:
- Appear in the system prompt documentation
- Be available to the agent for selection
- Have a LangChain tool created from its schema

## High-Impact Tools

The following tools require user confirmation before execution:
- `sheets_write_range` (overwrites data)
- `gmail_send_email` (sends immediately)
- `gmail_send_bulk_emails` (sends multiple emails)

The agent is instructed to confirm with users before executing these.

## Testing

```python
# Test schema access
from tools.schema import ALL_TOOL_SCHEMAS, get_tool_by_name
print(f"Total tools: {len(ALL_TOOL_SCHEMAS)}")
print(get_tool_by_name("apollo_search_people"))

# Test prompt generation
from agents.prompt_builder import get_campaign_agent_prompt
prompt = get_campaign_agent_prompt()
print(f"Prompt length: {len(prompt)} chars")

# Test agent
from agents import get_agent
agent = get_agent()
result = agent.chat("Find software engineers in San Francisco")
print(result)
```

## Benefits of This Architecture

1. **Single Source of Truth**: Tool definitions in one place
2. **Type Safety**: JSON Schema provides validation
3. **Dynamic Prompts**: No manual prompt maintenance
4. **Easy Extension**: Add tools without touching agent code
5. **Clear Contracts**: Explicit inputs, outputs, side effects
6. **Better Routing**: Intent patterns derived from tool metadata
7. **Audit Trail**: Side effects and costs documented per tool
