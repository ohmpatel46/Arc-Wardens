import os, sys, json, uuid, requests
from dotenv import load_dotenv
from circle_crypto import get_entity_secret_ciphertext

load_dotenv()
CIRCLE_BASE_URL = "https://api.circle.com"

def main():
    api_key = os.getenv("CIRCLE_API_KEY")
    wallet_set_id = os.getenv("CIRCLE_WALLET_SET_ID")
    if not api_key or not wallet_set_id:
        print("Missing CIRCLE_API_KEY or CIRCLE_WALLET_SET_ID in .env", file=sys.stderr)
        sys.exit(1)

    url = f"{CIRCLE_BASE_URL}/v1/w3s/developer/wallets"
    payload = {
        "idempotencyKey": str(uuid.uuid4()),
        "walletSetId": wallet_set_id,
        "accountType": "SCA",
        "blockchains": ["ARC-TESTNET"],
        "count": 1,
        "entitySecretCiphertext": get_entity_secret_ciphertext(),
        "metadata": [{"name": "arc-wardens-receiver-wallet", "refId": "receiver"}],
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "Accept": "application/json"}

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    print(f"HTTP {resp.status_code}")
    data = resp.json()
    print(json.dumps(data, indent=2))

    if resp.status_code >= 400:
        sys.exit(1)

    w = data["data"]["wallets"][0]
    print("\n✅ Receiver Wallet Created")
    print("Receiver Wallet ID:", w["id"])
    print("Receiver Address:", w["address"])

if __name__ == "__main__":
    main()
