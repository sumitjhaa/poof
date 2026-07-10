import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_key() -> bytes:
    """Generate a random 256-bit key."""
    return os.urandom(32)


def encrypt(key: bytes, plaintext: str) -> str:
    """Encrypt plaintext using AES-256-GCM. Returns base64-encoded ciphertext."""
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    combined = nonce + ciphertext
    return base64.urlsafe_b64encode(combined).decode()


def decrypt(key: bytes, encrypted_b64: str) -> str:
    """Decrypt base64-encoded ciphertext."""
    aesgcm = AESGCM(key)
    combined = base64.urlsafe_b64decode(encrypted_b64)
    nonce = combined[:12]
    ciphertext = combined[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()


def encode_key(key: bytes) -> str:
    """Encode key to base64url string for URL fragment."""
    return base64.urlsafe_b64encode(key).decode().rstrip("=")


def decode_key(key_b64: str) -> bytes:
    """Decode base64url key from URL fragment."""
    padded = key_b64 + "=" * (4 - len(key_b64) % 4)
    return base64.urlsafe_b64decode(padded)
