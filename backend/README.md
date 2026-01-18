# Backend Server

FastAPI server that provides API endpoints for Circle wallet operations.

## Features

- **FastAPI**: Modern, fast web framework with automatic OpenAPI documentation
- **Type Safety**: Pydantic models for request/response validation
- **Auto Documentation**: Swagger UI available at `http://localhost:5000/docs`
- **Async Support**: Built on async/await for better performance

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Make sure your `.env` file in the project root has:
   - `CIRCLE_API_KEY`
   - `CIRCLE_ENTITY_SECRET_BASE64`
   - `CIRCLE_PUBLIC_KEY_PEM`
   - `CIRCLE_WALLET_ID` (optional, can be set in frontend)

3. Run the server:
```bash
python server.py
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

- `GET /api/wallet/balance?walletId=<id>` - Get wallet balance
- `GET /api/wallet/info?walletId=<id>` - Get wallet information
- `GET /api/wallet/transactions?walletId=<id>&pageSize=50` - Get transaction history
- `POST /api/wallet/send` - Send a transaction
  ```json
  {
    "walletId": "...",
    "receiverAddress": "0x...",
    "amount": "1.0",
    "tokenId": "..."
  }
  ```
- `POST /api/wallet/faucet` - Request faucet funds
  ```json
  {
    "address": "0x...",
    "blockchain": "ARC-TESTNET"
  }
  ```
- `GET /health` - Health check
