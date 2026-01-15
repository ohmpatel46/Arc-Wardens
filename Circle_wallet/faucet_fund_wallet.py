import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

CIRCLE_BASE_URL = "https://api.circle.com"

def main():
    api_key = os.getenv("CIRCLE_API_KEY")
    address = os.getenv("CIRCLE_WALLET_ADDRESS")
    blockchain = os.getenv("CIRCLE_BLOCKCHAIN", "ARC-TESTNET")

    if not api_key:
        print("ERROR: CIRCLE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)
    if not address:
        print("ERROR: CIRCLE_WALLET_ADDRESS not found in .env", file=sys.stderr)
        sys.exit(1)

    url = f"{CIRCLE_BASE_URL}/v1/faucet/drips"

    payload = {
        "address": address,
        "blockchain": blockchain,
        "usdc": True,
        "native": False
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(f"Requesting test USDC to {address} on {blockchain}...")
    resp = requests.post(url, headers=headers, json=payload, timeout=30)

    print(f"HTTP {resp.status_code}")
    try:
        data = resp.json()
    except Exception:
        print(resp.text)
        sys.exit(1)

    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        print("\nERROR: Faucet request failed.", file=sys.stderr)
        sys.exit(1)

    print("\n✅ Faucet request submitted. Check balance next.")

if __name__ == "__main__":
    main()
