import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def decrypt(key: bytes, encrypted_b64: str) -> str:
    """Decrypt base64-encoded ciphertext."""
    aesgcm = AESGCM(key)
    combined = base64.urlsafe_b64decode(encrypted_b64)
    nonce = combined[:12]
    ciphertext = combined[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()
