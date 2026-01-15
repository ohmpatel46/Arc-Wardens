import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

load_dotenv()

def main():
    pem = os.getenv("CIRCLE_PUBLIC_KEY_PEM")
    if not pem:
        raise RuntimeError("CIRCLE_PUBLIC_KEY_PEM not found in .env")

    pem = pem.replace("\\n", "\n")

    # Generate 32-byte entity secret (store securely)
    entity_secret = os.urandom(32)

    # Load Circle public key
    public_key = serialization.load_pem_public_key(pem.encode("utf-8"))

    # Encrypt with RSA-OAEP + SHA256
    ciphertext_bytes = public_key.encrypt(
        entity_secret,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    entity_secret_ciphertext = base64.b64encode(ciphertext_bytes).decode("utf-8")
    entity_secret_b64 = base64.b64encode(entity_secret).decode("utf-8")

    print("\n=== SAVE THESE SECURELY ===")
    print("\nENTITY_SECRET_BASE64 (store privately, never commit):")
    print(entity_secret_b64)

    print("\nENTITY_SECRET_CIPHERTEXT (send to Circle API):")
    print(entity_secret_ciphertext)
    print("\n=========================\n")

if __name__ == "__main__":
    main()
