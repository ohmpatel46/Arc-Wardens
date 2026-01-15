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
    if not api_key:
        print("ERROR: CIRCLE_API_KEY not found in .env", file=sys.stderr)
        sys.exit(1)

    wallet_set_name = os.getenv("CIRCLE_WALLET_SET_NAME", "ArcWardens WalletSet")

    url = f"{CIRCLE_BASE_URL}/v1/w3s/developer/walletSets"

    payload = {
        "name": wallet_set_name,
        "entitySecretCiphertext": get_entity_secret_ciphertext()
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    # Optional idempotency (some Circle endpoints support it; safe to include if accepted)
    # If the API errors complaining about unknown field, remove it.
    payload["idempotencyKey"] = str(uuid.uuid4())

    print("Creating wallet set...")
    resp = requests.post(url, headers=headers, json=payload, timeout=30)

    print(f"HTTP {resp.status_code}")
    try:
        data = resp.json()
    except Exception:
        print(resp.text)
        sys.exit(1)

    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        print("\nERROR: Wallet set creation failed.", file=sys.stderr)
        sys.exit(1)

    # Circle typically returns data.walletSet.id (but handle slight variations)
    wallet_set_id = None
    if isinstance(data, dict):
        wallet_set_id = (
            data.get("data", {}).get("walletSet", {}).get("id")
            or data.get("data", {}).get("id")
        )

    if not wallet_set_id:
        print("\nWARNING: Could not auto-extract wallet set ID. Check response above.")
    else:
        print(f"\n✅ Wallet Set Created: {wallet_set_id}")

if __name__ == "__main__":
    main()
