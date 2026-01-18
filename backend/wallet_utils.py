import os
import sys
import json
import uuid
import requests
from dotenv import load_dotenv
import logging

# Configure logging for wallet_utils
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import circle_crypto from parent directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'Circle_wallet'))
from circle_crypto import get_entity_secret_ciphertext

load_dotenv()
CIRCLE_BASE_URL = "https://api.circle.com"

def get_api_key():
    """Get Circle API key from environment"""
    api_key = os.getenv("CIRCLE_API_KEY")
    if not api_key:
        raise RuntimeError("CIRCLE_API_KEY not found in .env")
    return api_key

def get_headers():
    """Get standard API headers"""
    return {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

def get_wallet_balance(wallet_id):
    """Get wallet balance"""
    # Clean and validate wallet ID
    wallet_id = wallet_id.strip()
    logger.info(f"Getting balance for wallet ID: {wallet_id} (length: {len(wallet_id)})")
    
    url = f"{CIRCLE_BASE_URL}/v1/w3s/wallets/{wallet_id}/balances?includeAll=true"
    headers = get_headers()
    
    logger.info(f"Calling Circle API: {url}")
    logger.info(f"Headers: {dict(headers)}")
    
    resp = requests.get(url, headers=headers, timeout=30)
    
    logger.info(f"Circle API response status: {resp.status_code}")
    if resp.status_code >= 400:
        logger.error(f"Circle API error response: {resp.text}")
    
    if resp.status_code >= 400:
        try:
            error_data = resp.json()
            return {'error': error_data.get('message', f'HTTP {resp.status_code}'), 'statusCode': resp.status_code}
        except:
            return {'error': f'HTTP {resp.status_code}: {resp.text}', 'statusCode': resp.status_code}
    
    try:
        data = resp.json()
        logger.info(f"Raw balance response structure: {json.dumps(data, indent=2)}")
        
        # Try multiple possible locations for balances
        balances = (
            data.get("data", {}).get("tokenBalances", []) or 
            data.get("data", {}).get("balances", []) or
            data.get("tokenBalances", []) or
            data.get("balances", []) or
            []
        )
        
        logger.info(f"Found {len(balances)} balance entries")
        logger.info(f"Balance entries: {json.dumps(balances, indent=2)}")
        
        # Extract USDC balance - check multiple possible field names and structures
        usdc_balance = None
        for b in balances:
            # Try different ways to get the symbol/currency
            symbol = (
                b.get("token", {}).get("symbol") or 
                b.get("token", {}).get("name") or
                b.get("symbol") or 
                b.get("currency") or 
                b.get("tokenSymbol") or
                ""
            ).upper()
            
            logger.info(f"Checking balance entry - symbol: {symbol}, full entry: {json.dumps(b, indent=2)}")
            
            # Check for USDC in various forms
            if symbol == "USDC" or symbol == "USD" or "USDC" in symbol:
                # Normalize the balance structure for frontend
                # Circle API might return amount in different fields
                amount = (
                    b.get("amount") or
                    b.get("balance") or
                    b.get("value") or
                    b.get("token", {}).get("amount") or
                    "0"
                )
                
                # Create normalized structure
                usdc_balance = {
                    "amount": str(amount),
                    "balance": str(amount),  # Alias for compatibility
                    "token": b.get("token") or {
                        "symbol": symbol,
                        "name": b.get("token", {}).get("name") or "USDC"
                    },
                    "raw": b  # Keep original for debugging
                }
                logger.info(f"Found USDC balance (normalized): {json.dumps(usdc_balance, indent=2)}")
                break
        
        # If still not found, check if there's a different structure
        if not usdc_balance:
            logger.warning("USDC balance not found in standard locations, checking alternative structures")
            # Check if data.data has a different structure
            data_data = data.get("data", {})
            if isinstance(data_data, dict):
                for key, value in data_data.items():
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                symbol = (
                                    item.get("token", {}).get("symbol") or 
                                    item.get("symbol") or 
                                    item.get("currency") or 
                                    ""
                                ).upper()
                                if symbol == "USDC" or symbol == "USD" or "USDC" in symbol:
                                    # Normalize this one too
                                    amount = (
                                        item.get("amount") or
                                        item.get("balance") or
                                        item.get("value") or
                                        item.get("token", {}).get("amount") or
                                        "0"
                                    )
                                    usdc_balance = {
                                        "amount": str(amount),
                                        "balance": str(amount),
                                        "token": item.get("token") or {
                                            "symbol": symbol,
                                            "name": item.get("token", {}).get("name") or "USDC"
                                        },
                                        "raw": item
                                    }
                                    logger.info(f"Found USDC in alternative location ({key}): {json.dumps(usdc_balance, indent=2)}")
                                    break
                    if usdc_balance:
                        break
        
        return {
            'success': True,
            'walletId': wallet_id,
            'balances': balances,
            'usdcBalance': usdc_balance,
            'rawData': data
        }
    except Exception as e:
        logger.exception(f"Error parsing balance response: {str(e)}")
        return {'error': f'Failed to parse response: {str(e)}', 'statusCode': 500}

def get_wallet_info(wallet_id):
    """Get wallet information"""
    # Clean and validate wallet ID
    wallet_id = wallet_id.strip()
    logger.info(f"Getting info for wallet ID: {wallet_id} (length: {len(wallet_id)})")
    
    url = f"{CIRCLE_BASE_URL}/v1/w3s/wallets/{wallet_id}"
    headers = get_headers()
    
    logger.info(f"Calling Circle API: {url}")
    
    resp = requests.get(url, headers=headers, timeout=30)
    
    logger.info(f"Circle API response status: {resp.status_code}")
    if resp.status_code >= 400:
        logger.error(f"Circle API error response: {resp.text}")
    
    if resp.status_code >= 400:
        try:
            error_data = resp.json()
            return {'error': error_data.get('message', f'HTTP {resp.status_code}'), 'statusCode': resp.status_code}
        except:
            return {'error': f'HTTP {resp.status_code}: {resp.text}', 'statusCode': resp.status_code}
    
    try:
        data = resp.json()
        wallet_data = data.get("data", {}).get("wallet", {}) or data.get("data", {})
        
        return {
            'success': True,
            'wallet': wallet_data,
            'rawData': data
        }
    except Exception as e:
        return {'error': f'Failed to parse response: {str(e)}', 'statusCode': 500}

def get_transactions(wallet_id, page_size=50):
    """Get transaction history for a wallet"""
    # Clean and validate wallet ID
    wallet_id = wallet_id.strip()
    logger.info(f"Getting transactions for wallet ID: {wallet_id} (length: {len(wallet_id)})")
    
    # Try the list transactions endpoint with walletIds filter
    # Circle API uses /v1/w3s/transactions with walletIds query param
    url = f"{CIRCLE_BASE_URL}/v1/w3s/transactions"
    headers = get_headers()
    
    params = {
        'walletIds': wallet_id,  # Filter by wallet ID
        'pageSize': page_size
    }
    
    logger.info(f"Calling Circle API: {url} with params: {params}")
    
    resp = requests.get(url, headers=headers, params=params, timeout=30)
    
    logger.info(f"Circle API response status: {resp.status_code}")
    if resp.status_code >= 400:
        logger.error(f"Circle API error response: {resp.text}")
        
        # If that fails, try the wallet-specific endpoint as fallback
        logger.info("Trying fallback endpoint: /v1/w3s/wallets/{wallet_id}/transactions")
        fallback_url = f"{CIRCLE_BASE_URL}/v1/w3s/wallets/{wallet_id}/transactions"
        fallback_resp = requests.get(fallback_url, headers=headers, params={'pageSize': page_size}, timeout=30)
        logger.info(f"Fallback response status: {fallback_resp.status_code}")
        
        if fallback_resp.status_code >= 400:
            try:
                error_data = fallback_resp.json()
                return {'error': error_data.get('message', f'HTTP {fallback_resp.status_code}'), 'statusCode': fallback_resp.status_code}
            except:
                return {'error': f'HTTP {fallback_resp.status_code}: {fallback_resp.text}', 'statusCode': fallback_resp.status_code}
        else:
            resp = fallback_resp
    
    if resp.status_code >= 400:
        try:
            error_data = resp.json()
            return {'error': error_data.get('message', f'HTTP {resp.status_code}'), 'statusCode': resp.status_code}
        except:
            return {'error': f'HTTP {resp.status_code}: {resp.text}', 'statusCode': resp.status_code}
    
    try:
        data = resp.json()
        # Circle API might return transactions in different structures
        transactions = (
            data.get("data", {}).get("transactions", []) or 
            data.get("data", {}).get("items", []) or
            data.get("transactions", []) or
            []
        )
        
        return {
            'success': True,
            'walletId': wallet_id,
            'transactions': transactions,
            'rawData': data
        }
    except Exception as e:
        logger.exception(f"Error parsing transactions response: {str(e)}")
        return {'error': f'Failed to parse response: {str(e)}', 'statusCode': 500}

def send_transaction(wallet_id, receiver_address, amount, token_id):
    """Send a transaction"""
    url = f"{CIRCLE_BASE_URL}/v1/w3s/developer/transactions/transfer"
    
    payload = {
        "idempotencyKey": str(uuid.uuid4()),
        "walletId": wallet_id,
        "destinationAddress": receiver_address,
        "tokenId": token_id,
        "amounts": [str(amount)],
        "feeLevel": "MEDIUM",
        "entitySecretCiphertext": get_entity_secret_ciphertext(),
        "refId": "arc-wardens-transfer"
    }
    
    headers = get_headers()
    
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    
    if resp.status_code == 204:
        return {
            'success': True,
            'message': 'Transaction submitted (204 No Content)',
            'statusCode': 204
        }
    
    if resp.status_code >= 400:
        try:
            error_data = resp.json()
            return {'error': error_data.get('message', f'HTTP {resp.status_code}'), 'statusCode': resp.status_code}
        except:
            return {'error': f'HTTP {resp.status_code}: {resp.text}', 'statusCode': resp.status_code}
    
    try:
        data = resp.json()
        tx_data = data.get("data", {})
        
        return {
            'success': True,
            'transaction': tx_data,
            'transactionId': tx_data.get('id'),
            'state': tx_data.get('state'),
            'rawData': data
        }
    except Exception as e:
        return {'error': f'Failed to parse response: {str(e)}', 'statusCode': 500}

def request_faucet(address, blockchain='ARC-TESTNET'):
    """Request faucet funds"""
    url = f"{CIRCLE_BASE_URL}/v1/faucet/drips"
    
    payload = {
        "address": address,
        "blockchain": blockchain,
        "usdc": True,
        "native": False
    }
    
    headers = get_headers()
    
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    
    if resp.status_code >= 400:
        try:
            error_data = resp.json()
            return {'error': error_data.get('message', f'HTTP {resp.status_code}'), 'statusCode': resp.status_code}
        except:
            return {'error': f'HTTP {resp.status_code}: {resp.text}', 'statusCode': resp.status_code}
    
    try:
        data = resp.json()
        return {
            'success': True,
            'message': 'Faucet request submitted',
            'data': data
        }
    except Exception as e:
        return {'error': f'Failed to parse response: {str(e)}', 'statusCode': 500}
