"""
Tools Module for the Campaign Agent.
MCP-style tool definitions with centralized schemas and dynamic registration.

Architecture:
- schema.py: MCP-style JSON Schema tool definitions (source of truth)
- registry.py: Maps schemas to execution functions, creates LangChain tools
- Individual tool files (apollo_tool.py, etc.): Kept for reference but not used

Usage:
    from tools import ALL_TOOLS  # LangChain tools for the agent
    from tools.schema import ALL_TOOL_SCHEMAS  # Raw MCP schemas
    from tools.registry import TOOL_EXECUTORS  # Direct access to executors
"""

# Import the dynamically generated LangChain tools
from .registry import ALL_TOOLS, TOOL_EXECUTORS, create_langchain_tool

# Import schema utilities
from .schema import (
    ALL_TOOL_SCHEMAS,
    TOOL_CATEGORIES,
    get_tool_by_name,
    get_tools_by_category,
    get_high_impact_tools,
)

__all__ = [
    # LangChain tools (for agent)
    "ALL_TOOLS",
    
    # Schema access
    "ALL_TOOL_SCHEMAS",
    "TOOL_CATEGORIES",
    "get_tool_by_name",
    "get_tools_by_category",
    "get_high_impact_tools",
    
    # Registry access
    "TOOL_EXECUTORS",
    "create_langchain_tool",
]
