import os
import sys
import json
import uuid
import requests
from dotenv import load_dotenv

from circle_crypto import get_entity_secret_ciphertext

load_dotenv()

CIRCLE_BASE_URL = "https://api.circle.com"

def main():
    api_key = os.getenv("CIRCLE_API_KEY")
    wallet_set_id = os.getenv("CIRCLE_WALLET_SET_ID")

    if not api_key:
        print("ERROR: CIRCLE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)

    if not wallet_set_id:
        print("ERROR: CIRCLE_WALLET_SET_ID not found in .env", file=sys.stderr)
        sys.exit(1)

    url = f"{CIRCLE_BASE_URL}/v1/w3s/developer/wallets"

    payload = {
        "idempotencyKey": str(uuid.uuid4()),  # ✅ REQUIRED
        "walletSetId": wallet_set_id,
        "accountType": "SCA",
        "blockchains": ["ARC-TESTNET"],
        "count": 1,
        "entitySecretCiphertext": get_entity_secret_ciphertext(),
        "metadata": [
            {"name": "arc-wardens-main-wallet", "refId": "agent_treasury"}
        ],
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print("Creating wallet...")
    resp = requests.post(url, headers=headers, json=payload, timeout=30)

    print(f"HTTP {resp.status_code}")
    try:
        data = resp.json()
    except Exception:
        print(resp.text)
        sys.exit(1)

    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        print("\nERROR: Wallet creation failed.", file=sys.stderr)
        sys.exit(1)

    # Circle typically returns data.wallets (array)
    wallets = data.get("data", {}).get("wallets", [])
    if not wallets:
        print("\nWARNING: No wallets returned in response. Check JSON above.")
        sys.exit(0)

    w = wallets[0]
    print("\n✅ Wallet Created")
    print("Wallet ID:", w.get("id"))
    print("Address:", w.get("address"))
    print("Blockchain:", w.get("blockchain"))

if __name__ == "__main__":
    main()
