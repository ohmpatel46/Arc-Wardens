from contextvars import ContextVar
from typing import Optional, Dict, Any

current_token_var: ContextVar[Optional[str]] = ContextVar("current_token", default=None)
current_user_var: ContextVar[Optional[Dict[str, Any]]] = ContextVar("current_user", default=None)
