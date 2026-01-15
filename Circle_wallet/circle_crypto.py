import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

load_dotenv()

def get_entity_secret_ciphertext() -> str:
    """
    Returns a fresh Circle-compatible entitySecretCiphertext
    using the stored entity secret and Circle public key.
    """

    secret_b64 = os.getenv("CIRCLE_ENTITY_SECRET_BASE64")
    pem = os.getenv("CIRCLE_PUBLIC_KEY_PEM")

    if not secret_b64:
        raise RuntimeError("CIRCLE_ENTITY_SECRET_BASE64 not found in .env")
    if not pem:
        raise RuntimeError("CIRCLE_PUBLIC_KEY_PEM not found in .env")

    pem = pem.replace("\\n", "\n")

    entity_secret = base64.b64decode(secret_b64)

    public_key = serialization.load_pem_public_key(pem.encode("utf-8"))

    ciphertext_bytes = public_key.encrypt(
        entity_secret,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return base64.b64encode(ciphertext_bytes).decode("utf-8")


# Allow script to be run directly for manual generation
if __name__ == "__main__":
    ciphertext = get_entity_secret_ciphertext()
    print("\nENTITY_SECRET_CIPHERTEXT:\n")
    print(ciphertext)
    print("\n(use this in Circle API requests)\n")
