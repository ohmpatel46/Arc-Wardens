from contextvars import ContextVar
from typing import Optional

current_token_var: ContextVar[Optional[str]] = ContextVar("current_token", default=None)
