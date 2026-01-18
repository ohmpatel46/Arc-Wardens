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

from core.wallet_utils import (
    get_wallet_balance,
    send_transaction,
    get_transactions,
    get_wallet_info,
    request_faucet
)
from core.db import (
    get_all_campaigns, 
    get_campaign_analytics,
    create_campaign,
    update_campaign,
    delete_campaign,
    create_or_update_analytics
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
    name: Optional[str] = None

class CampaignUpdateRequest(BaseModel):
    campaignId: str
    name: Optional[str] = None
    paid: Optional[bool] = None
    cost: Optional[float] = None
    status: Optional[str] = None


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
    """Handle campaign chat messages using LangChain agent"""
    try:
        from agents import get_agent
        
        agent = get_agent()
        result = agent.chat(
            message=request.message,
            conversation_history=request.conversationHistory
        )
        
        return result
    except Exception as e:
        logger.exception(f"Error in campaign chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/pay")
async def campaign_pay(request: CampaignPayRequest):
    """Process campaign payment and update database"""
    try:
        # Update campaign as paid in database
        update_campaign(
            request.campaignId,
            paid=True,
            cost=request.amount,
            status='active'
        )
        
        # Generate sample analytics for the paid campaign
        from core.db import generate_sample_analytics
        sample_analytics = generate_sample_analytics(request.campaignId)
        create_or_update_analytics(
            request.campaignId,
            emails_sent=sample_analytics['emailsSent'],
            emails_opened=sample_analytics['emailsOpened'],
            replies=sample_analytics['replies'],
            bounce_rate=sample_analytics['bounceRate']
        )
        
        return {
            'success': True,
            'message': f'Payment processed for campaign {request.campaignId}',
            'amount': request.amount,
            'transactionId': f'tx_{request.campaignId}_{int(time.time())}'
        }
    except Exception as e:
        logger.exception(f"Error processing payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/create")
async def campaign_create(request: CampaignCreateRequest):
    """Create or update a campaign in the database"""
    try:
        # Use provided name or extract from messages or use default
        campaign_name = request.name or 'New Campaign'
        if not request.name and request.messages and len(request.messages) > 0:
            # Try to extract name from first user message
            first_user_msg = next((m for m in request.messages if m.get('role') == 'user'), None)
            if first_user_msg and first_user_msg.get('content'):
                # Use first 50 chars as name
                campaign_name = first_user_msg['content'][:50]
        
        # Create campaign in database
        create_campaign(request.campaignId, campaign_name)
        
        return {
            'success': True,
            'message': f'Campaign {request.campaignId} created successfully',
            'campaignId': request.campaignId,
            'name': campaign_name
        }
    except Exception as e:
        logger.exception(f"Error creating campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/campaign/update")
async def campaign_update(request: CampaignUpdateRequest):
    """Update a campaign in the database"""
    try:
        update_campaign(
            request.campaignId,
            name=request.name,
            paid=request.paid,
            cost=request.cost,
            status=request.status
        )
        return {
            'success': True,
            'message': f'Campaign {request.campaignId} updated successfully'
        }
    except Exception as e:
        logger.exception(f"Error updating campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/campaign/delete")
async def campaign_delete(campaignId: str = Query(..., description="Campaign ID to delete")):
    """Delete a campaign from the database"""
    try:
        delete_campaign(campaignId)
        return {
            'success': True,
            'message': f'Campaign {campaignId} deleted successfully'
        }
    except Exception as e:
        logger.exception(f"Error deleting campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics_endpoint(campaign_id: str):
    """Get analytics for a specific campaign"""
    try:
        campaign = get_campaign_analytics(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
        return {
            'success': True,
            'campaign': campaign
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting campaign analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns")
async def get_campaigns():
    """Get all campaigns from database"""
    try:
        campaigns = get_all_campaigns()
        return {
            'success': True,
            'campaigns': campaigns
        }
    except Exception as e:
        logger.exception(f"Error getting campaigns: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {'status': 'ok'}

if __name__ == '__main__':
    import uvicorn
    # Use reload=False when running directly, or run with: uvicorn server:app --reload
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)
