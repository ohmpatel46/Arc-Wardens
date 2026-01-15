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
    sender_wallet_id = os.getenv("CIRCLE_SENDER_WALLET_ID")
    receiver_address = os.getenv("CIRCLE_RECEIVER_ADDRESS")
    token_id = os.getenv("CIRCLE_USDC_TESTNET_TOKEN_ID")

    # change this to "0.5" or "2" etc. (strings)
    amount = os.getenv("CIRCLE_SEND_AMOUNT", "1")

    if not api_key:
        print("ERROR: CIRCLE_API_KEY missing", file=sys.stderr); sys.exit(1)
    if not sender_wallet_id:
        print("ERROR: CIRCLE_SENDER_WALLET_ID missing", file=sys.stderr); sys.exit(1)
    if not receiver_address:
        print("ERROR: CIRCLE_RECEIVER_ADDRESS missing", file=sys.stderr); sys.exit(1)
    if not token_id:
        print("ERROR: CIRCLE_USDC_TESTNET_TOKEN_ID missing", file=sys.stderr); sys.exit(1)

    url = f"{CIRCLE_BASE_URL}/v1/w3s/developer/transactions/transfer"

    payload = {
        "idempotencyKey": str(uuid.uuid4()),
        "walletId": sender_wallet_id,
        "destinationAddress": receiver_address,
        "tokenId": token_id,
        "amounts": [str(amount)],
        "feeLevel": "MEDIUM",
        "entitySecretCiphertext": get_entity_secret_ciphertext(),
        "refId": "arc-wardens-test-transfer"
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(f"Sending {amount} USDC-TESTNET from {sender_wallet_id} -> {receiver_address} ...")
    resp = requests.post(url, headers=headers, json=payload, timeout=60)

    print(f"HTTP {resp.status_code}")

    # Some Circle endpoints may return 201 + JSON, but never assume
    if resp.status_code == 204:
        print("✅ Submitted (204 No Content). Check transaction list / balances next.")
        return

    try:
        data = resp.json()
    except Exception:
        print(resp.text)
        sys.exit(1)

    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        print("\nERROR: Transfer failed.", file=sys.stderr)
        sys.exit(1)

    tx_id = data.get("data", {}).get("id")
    state = data.get("data", {}).get("state")
    print(f"\n✅ Transfer submitted. tx_id={tx_id} state={state}")


if __name__ == "__main__":
    main()
