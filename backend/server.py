from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sys
import os
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add Circle_wallet to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Circle_wallet'))

from wallet_utils import (
    get_wallet_balance,
    send_transaction,
    get_transactions,
    get_wallet_info,
    request_faucet
)

app = FastAPI(title="Arc Wardens API", version="1.0.0")

# Add exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    logger.error(f"Request URL: {request.url}")
    logger.error(f"Query params: {request.query_params}")
    logger.error(f"Request body: {await request.body() if hasattr(request, 'body') else 'N/A'}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "query_params": str(request.query_params)}
    )

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path} - Query: {request.query_params}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class SendTransactionRequest(BaseModel):
    walletId: str
    receiverAddress: str
    amount: str
    tokenId: str

class FaucetRequest(BaseModel):
    address: str
    blockchain: Optional[str] = "ARC-TESTNET"

class CampaignChatRequest(BaseModel):
    message: str
    campaignId: str
    conversationHistory: Optional[list] = []

class CampaignPayRequest(BaseModel):
    campaignId: str
    amount: float

class CampaignCreateRequest(BaseModel):
    campaignId: str
    messages: list

@app.get("/api/wallet/balance")
async def get_balance(request: Request, walletId: str = Query(..., description="Wallet ID")):
    """Get wallet balance"""
    try:
        logger.info(f"GET /api/wallet/balance - walletId: {walletId}")
        logger.info(f"Query params: {dict(request.query_params)}")
        logger.info(f"All query params: {request.query_params}")
        
        if not walletId:
            logger.error("walletId is empty")
            raise HTTPException(status_code=400, detail="walletId parameter required")
        
        result = get_wallet_balance(walletId)
        logger.info(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if result.get('error'):
            logger.error(f"Wallet balance error: {result.get('error')}")
            raise HTTPException(status_code=result.get('statusCode', 500), detail=result['error'])
        return result
    except HTTPException as e:
        logger.error(f"HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in get_balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/info")
async def get_info(request: Request, walletId: str = Query(..., description="Wallet ID")):
    """Get wallet information"""
    try:
        logger.info(f"GET /api/wallet/info - walletId: {walletId}")
        logger.info(f"Query params: {dict(request.query_params)}")
        
        if not walletId:
            logger.error("walletId is empty")
            raise HTTPException(status_code=400, detail="walletId parameter required")
        
        result = get_wallet_info(walletId)
        logger.info(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if result.get('error'):
            logger.error(f"Wallet info error: {result.get('error')}")
            raise HTTPException(status_code=result.get('statusCode', 500), detail=result['error'])
        return result
    except HTTPException as e:
        logger.error(f"HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in get_info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/transactions")
async def get_transactions_history(
    request: Request,
    walletId: str = Query(..., description="Wallet ID"),
    pageSize: int = Query(50, description="Number of transactions to return")
):
    """Get transaction history"""
    try:
        logger.info(f"GET /api/wallet/transactions - walletId: {walletId}, pageSize: {pageSize}")
        logger.info(f"Query params: {dict(request.query_params)}")
        
        if not walletId:
            logger.error("walletId is empty")
            raise HTTPException(status_code=400, detail="walletId parameter required")
        
        result = get_transactions(walletId, pageSize)
        logger.info(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if result.get('error'):
            logger.error(f"Transactions error: {result.get('error')}")
            raise HTTPException(status_code=result.get('statusCode', 500), detail=result['error'])
        return result
    except HTTPException as e:
        logger.error(f"HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in get_transactions_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wallet/send")
async def send_transaction_endpoint(request: SendTransactionRequest):
    """Send a transaction"""
    try:
        result = send_transaction(
            request.walletId,
            request.receiverAddress,
            request.amount,
            request.tokenId
        )
        if result.get('error'):
            raise HTTPException(status_code=result.get('statusCode', 500), detail=result['error'])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wallet/faucet")
async def request_faucet_endpoint(request: FaucetRequest):
    """Request faucet funds"""
    try:
        result = request_faucet(request.address, request.blockchain)
        if result.get('error'):
            raise HTTPException(status_code=result.get('statusCode', 500), detail=result['error'])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/chat")
async def campaign_chat(request: CampaignChatRequest):
    """Handle campaign chat messages"""
    try:
        # Stub response - replace with actual AI/LLM integration
        return {
            'success': True,
            'message': f'This is a placeholder response to: {request.message}',
            'response': f'Campaign chat endpoint - message received for campaign {request.campaignId}',
            'campaignCost': None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/pay")
async def campaign_pay(request: CampaignPayRequest):
    """Process campaign payment"""
    try:
        # Stub response - replace with actual payment processing
        return {
            'success': True,
            'message': f'Payment processed for campaign {request.campaignId}',
            'amount': request.amount,
            'transactionId': f'tx_{request.campaignId}_{int(time.time())}'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/create")
async def campaign_create(request: CampaignCreateRequest):
    """Create a campaign"""
    try:
        # Stub response - replace with actual campaign creation logic
        return {
            'success': True,
            'message': f'Campaign {request.campaignId} created successfully',
            'campaignId': request.campaignId,
            'messagesCount': len(request.messages)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {'status': 'ok'}

if __name__ == '__main__':
    import uvicorn
    # Use reload=False when running directly, or run with: uvicorn server:app --reload
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)
