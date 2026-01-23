from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sys
import os
import time
import time
import json
import logging
from dotenv import load_dotenv

# Load environment variables from root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

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
    delete_campaign,
    create_or_update_analytics,
    create_user_if_not_exists
)
from core.auth import verify_google_token
from fastapi import Header, Depends

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"GLOBAL EXCEPTION CAUGHT: {exc}")
    import traceback
    error_details = traceback.format_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "traceback": error_details},
    )

# Pydantic models for request/response validation
class SendTransactionRequest(BaseModel):
    walletId: Optional[str] = None
    receiverAddress: Optional[str] = None
    amount: str
    tokenId: Optional[str] = None

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
    status: Optional[str] = None

class AuthRequest(BaseModel):
    token: str

async def get_current_user(authorization: Optional[str] = Header(None), x_google_access_token: Optional[str] = Header(None, alias="X-Google-AccessToken")):
    logger.info(f"get_current_user - Auth Header: {bool(authorization)}, Google Header: {bool(x_google_access_token)}")
    if not authorization:
        # For dev/test ease, if no header, maybe return None? No, we want strict auth now.
        # But wait, the user said "It should work in the first go" - 
        # existing tests might fail if I enforce it too strictly without updating frontend first.
        # But I AM updating frontend next.
        raise HTTPException(status_code=401, detail="Missing authentication header")
    
    if not authorization.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Invalid authentication header format")
    
    token = authorization.split(" ")[1]
    user_data = verify_google_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    user_data['access_token'] = x_google_access_token
    # Create or update user in DB
    create_user_if_not_exists(user_data)
    
    return user_data


@app.post("/api/auth/google")
async def auth_google(request: AuthRequest):
    """Verify Google token and return user info"""
    user_data = verify_google_token(request.token)
    if not user_data:
         raise HTTPException(status_code=401, detail="Invalid token")
    
    create_user_if_not_exists(user_data)
    return {"user": user_data}

@app.get("/api/wallet/balance")
async def get_balance(request: Request, walletId: Optional[str] = Query(None, description="Wallet ID")):
    """Get wallet balance"""
    try:
        logger.info(f"GET /api/wallet/balance - walletId: {walletId}")
        logger.info(f"Query params: {dict(request.query_params)}")
        logger.info(f"All query params: {request.query_params}")
        
        if not walletId:
            walletId = os.getenv('CIRCLE_WALLET_ID')
            logger.info(f"Using walletId from env: {walletId}")

        if not walletId:
            logger.error("walletId is empty and not in env")
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
async def get_info(request: Request, walletId: Optional[str] = Query(None, description="Wallet ID")):
    """Get wallet information"""
    try:
        logger.info(f"GET /api/wallet/info - walletId: {walletId}")
        logger.info(f"Query params: {dict(request.query_params)}")
        
        if not walletId:
            walletId = os.getenv('CIRCLE_WALLET_ID')

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
    walletId: Optional[str] = Query(None, description="Wallet ID"),
    pageSize: int = Query(50, description="Number of transactions to return")
):
    """Get transaction history"""
    try:
        logger.info(f"GET /api/wallet/transactions - walletId: {walletId}, pageSize: {pageSize}")
        logger.info(f"Query params: {dict(request.query_params)}")
        
        if not walletId:
            walletId = os.getenv('CIRCLE_WALLET_ID')

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
        # Get values from request or env
        walletId = request.walletId or os.getenv('CIRCLE_SENDER_WALLET_ID')
        receiverAddress = request.receiverAddress or os.getenv('CIRCLE_RECEIVER_ADDRESS')
        tokenId = request.tokenId or os.getenv('CIRCLE_USDC_TESTNET_TOKEN_ID')
        
        if not walletId or not receiverAddress or not tokenId:
             raise HTTPException(status_code=400, detail="Missing required parameters (walletId, receiverAddress, tokenId) and env vars not set")

        result = send_transaction(
            walletId,
            receiverAddress,
            request.amount,
            tokenId
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
async def campaign_chat(request: CampaignChatRequest, user: dict = Depends(get_current_user)):
    """Handle campaign chat messages using LangChain agent"""
    try:
        # Verify campaign ownership
        campaign = get_campaign_analytics(request.campaignId, user['user_id'])
        if not campaign:
            raise HTTPException(status_code=403, detail="Access denied to this campaign")

        msg = request.message.lower().strip()
        access_token = user.get('access_token')

        # TRIGGER 1: Direct Email Send (Manual Bypass)
        # TRIGGER 1: Direct Email Send (Manual Bypass) - DISABLED (Functionality moved to Payment)
        if msg == "send emails":
            return {
                "success": True, 
                "message": "Please click the 'Pay' button to launch your campaign and send emails.",
                "response": "Email sending is now triggered via the Payment flow."
            }


        # Use AI Agent with Context
        try:
            from agents import get_agent
            from core.context import current_token_var
            
            # Set token in context for tools to use
            token_reset = current_token_var.set(access_token)
            
            try:
                agent = get_agent()
                
                logger.info("Calling CampaignAgent...")
                # Note: access_token is consumed via context variable in tools, not passed to chat()
                result = agent.chat(
                    message=request.message,
                    conversation_history=request.conversationHistory
                )
                return result
            finally:
                current_token_var.reset(token_reset)

        except Exception as e:
            logger.exception("AI Agent failed")
            return {
                "success": False,
                "error": str(e),
                "message": "The AI Agent encountered an error. If this is an authentication error, please ensure your OPENAI_API_KEY is set in .env."
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in campaign chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/pay")
async def campaign_pay(request: CampaignPayRequest, user: dict = Depends(get_current_user)):
    """Process campaign payment and update database"""
    try:
        # Update campaign as paid in database
        update_campaign(
            request.campaignId,
            user_id=user['user_id'],
            executed=True,
            cost=request.amount,
            status='active'
        )
        
        # --- TRIGGER EMAIL SENDING ON PAYMENT ---
        access_token = user.get('access_token')
        emails_sent = 0
        
        if access_token:
            from tools.registry import gmail_tool
            logger.info(f"Payment successful. Triggering email campaign {request.campaignId}")
            
            params = {
                "access_token": access_token,
                "campaign_id": request.campaignId,
                "user_id": user['user_id']
            }
            try:
                res_str = gmail_tool("send_to_list", json.dumps(params))
                res = json.loads(res_str)
                
                # Parse results for analytics
                if res.get("status") == "success":
                    # Count successful results
                    results = res.get("results", [])
                    emails_sent = sum(1 for r in results if r.get("result", {}).get("status") == "success")
                
                logger.info(f"Campaign triggered. Sent {emails_sent} emails.")
                
            except Exception as e:
                logger.error(f"Failed to trigger emails after payment: {e}")
        else:
            logger.warning("No access_token found during payment. Cannot trigger emails.")

        # Update real analytics
        create_or_update_analytics(
             request.campaignId,
             emails_sent=emails_sent,
             emails_opened=0,
             replies=0,
             bounce_rate=0.0
        )
        
        return {
            'success': True,
            'message': f'Payment processed and campaign launched! Sent {emails_sent} emails.',
            'amount': request.amount,
            'transactionId': f'tx_{request.campaignId}_{int(time.time())}'
        }
    except Exception as e:
        logger.exception(f"Error processing payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaigns/{campaign_id}/verify_status")
async def verify_campaign_status(campaign_id: str, user: dict = Depends(get_current_user)):
    """Check for replies and update status"""
    try:
        access_token = user.get('access_token')
        if not access_token:
            return {"success": False, "message": "No access token"}
            
        from tools.registry import gmail_tool
        
        params = {
            "access_token": access_token,
            "campaign_id": campaign_id,
            "user_id": user['user_id']
        }
        res_str = gmail_tool("check_replies", json.dumps(params))
        res = json.loads(res_str)
        
        return {
            "success": True,
            "data": res
        }
    except Exception as e:
        logger.exception(f"Error checking status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/create")
async def campaign_create(request: CampaignCreateRequest, user: dict = Depends(get_current_user)):
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
        
        create_campaign(request.campaignId, campaign_name, user['user_id'])
        
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
async def campaign_update(request: CampaignUpdateRequest, user: dict = Depends(get_current_user)):
    """Update a campaign in the database"""
    try:
        update_campaign(
            request.campaignId,
            user_id=user['user_id'],
            name=request.name,
            executed=request.paid,
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
async def campaign_delete(campaignId: str = Query(..., description="Campaign ID to delete"), user: dict = Depends(get_current_user)):
    """Delete a campaign from the database"""
    try:
        delete_campaign(campaignId, user['user_id'])
        return {
            'success': True,
            'message': f'Campaign {campaignId} deleted successfully'
        }
    except Exception as e:
        logger.exception(f"Error deleting campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics_endpoint(campaign_id: str, user: dict = Depends(get_current_user)):
    """Get analytics for a specific campaign"""
    try:
        campaign = get_campaign_analytics(campaign_id, user['user_id'])
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
async def get_campaigns(user: dict = Depends(get_current_user)):
    """Get all campaigns for current user"""
    try:
        campaigns = get_all_campaigns(user['user_id'])
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
    uvicorn.run(app, host="0.0.0.0", port=5001, reload=False)
