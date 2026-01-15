import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()
CIRCLE_BASE_URL = "https://api.circle.com"

def main():
    api_key = os.getenv("CIRCLE_API_KEY")
    wallet_id = os.getenv("CIRCLE_WALLET_ID")

    if not api_key:
        print("ERROR: CIRCLE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)
    if not wallet_id:
        print("ERROR: CIRCLE_WALLET_ID not found in .env", file=sys.stderr)
        sys.exit(1)

    url = f"{CIRCLE_BASE_URL}/v1/w3s/wallets/{wallet_id}/balances?includeAll=true"
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}

    print(f"Fetching balances for wallet {wallet_id}...")
    resp = requests.get(url, headers=headers, timeout=30)

    print(f"HTTP {resp.status_code}")
    try:
        data = resp.json()
    except Exception:
        print(resp.text)
        sys.exit(1)

    # Pretty print full response
    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        print("\nERROR: Balance fetch failed.", file=sys.stderr)
        sys.exit(1)

    # Convenience: extract USDC if present
    balances = data.get("data", {}).get("tokenBalances", []) or data.get("data", {}).get("balances", [])
    usdc = None
    for b in balances:
        # Different Circle responses use different keys; try common ones
        symbol = (b.get("token", {}).get("symbol") or b.get("symbol") or b.get("currency") or "").upper()
        if symbol == "USDC" or symbol == "USD":
            usdc = b
            break

    if usdc:
        print("\n✅ USDC balance found:")
        print(json.dumps(usdc, indent=2))
    else:
        print("\nℹ️ USDC not visible yet in response. If faucet just ran, retry in ~30–60 seconds.")

if __name__ == "__main__":
    main()
