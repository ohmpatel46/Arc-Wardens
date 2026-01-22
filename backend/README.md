# Backend Server

FastAPI server that provides API endpoints for Circle wallet operations and campaign management.

## Project Structure

```
backend/
├── agents/              # LangChain agents
│   ├── __init__.py
│   └── campaign_agent.py    # Central campaign agent
├── tools/               # Agent tools (MCP-style)
│   ├── __init__.py          # Tool exports
│   ├── schema.py            # MCP-style JSON Schema definitions
│   └── registry.py          # Tool executors and LangChain integration
├── core/                # Core utilities
│   ├── __init__.py
│   ├── db.py            # Database operations
│   └── wallet_utils.py  # Circle wallet utilities
├── api/                 # API routes (future)
│   └── routes/
├── server.py            # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── campaigns.db         # SQLite database (auto-generated)
└── README.md
```

## Features

- **FastAPI**: Modern, fast web framework with automatic OpenAPI documentation
- **Type Safety**: Pydantic models for request/response validation
- **Auto Documentation**: Swagger UI available at `http://localhost:5000/docs`
- **Async Support**: Built on async/await for better performance
- **LangChain Agent**: AI-powered campaign agent with tool support

## Setup


```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Make sure your `.env` file in the project root has:
   - `CIRCLE_API_KEY`
   - `CIRCLE_ENTITY_SECRET_BASE64`
   - `CIRCLE_PUBLIC_KEY_PEM`
   - `GOOGLE_API_KEY` (for the LangChain agent using Gemini)
   - `CIRCLE_WALLET_ID` (optional, can be set in frontend)

3. Run the server:
```bash
python3 server.py
```

Or using uvicorn directly:
```bash
uvicorn server:app --reload --port 5000
```

The server will run on `http://localhost:5000`

4. Access API documentation:
   - Swagger UI: `http://localhost:5000/docs`
   - ReDoc: `http://localhost:5000/redoc`

## API Endpoints

### Wallet Endpoints
- `GET /api/wallet/balance?walletId=<id>` - Get wallet balance
- `GET /api/wallet/info?walletId=<id>` - Get wallet information
- `GET /api/wallet/transactions?walletId=<id>&pageSize=50` - Get transaction history
- `POST /api/wallet/send` - Send a transaction
- `POST /api/wallet/faucet` - Request faucet funds

### Campaign Endpoints
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/{campaign_id}/analytics` - Get campaign analytics
- `POST /api/campaign/chat` - Chat with campaign agent
- `POST /api/campaign/create` - Create a campaign
- `PUT /api/campaign/update` - Update a campaign
- `DELETE /api/campaign/delete?campaignId=<id>` - Delete a campaign

### Health
- `GET /health` - Health check

## Agent Architecture (MCP-Style)

The campaign agent uses Model Context Protocol (MCP) style tool definitions:

### Key Files
- `tools/schema.py` - JSON Schema tool definitions (source of truth)
- `tools/registry.py` - Tool executors and LangChain integration
- `agents/prompt_builder.py` - Dynamic system prompt generation

### Available Tools (14 total)

| Category | Tools |
|----------|-------|
| Lead Generation | `apollo_search_people`, `apollo_search_companies`, `apollo_enrich_person` |
| List Management | `apollo_create_list`, `apollo_add_to_list` |
| Data Management | `sheets_read_range`, `sheets_write_range`, `sheets_append_rows`, `sheets_update_cell` |
| Email Operations | `gmail_send_email`, `gmail_send_bulk_emails`, `gmail_create_draft` |
| Utility | `ask_for_clarification`, `repeat_campaign_action` |

### Intent Routing
Intent routing is handled in the system prompt (no separate routing tool). The prompt is dynamically generated from tool schemas, including:
- Tool documentation with parameters
- Intent-to-tool mapping guidelines
- Execution best practices
- High-impact action confirmations

**Note**: All tools currently have placeholder implementations. See `MCP_IMPLEMENTATION.md` for details on the architecture.
