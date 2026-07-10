import os
import base64
from nacl.secret import SecretBox
from nacl.utils import random as nacl_random


def generate_key() -> bytes:
    """Generate a random 256-bit key."""
    return nacl_random(SecretBox.KEY_SIZE)


def encrypt(key: bytes, plaintext: str) -> str:
    """Encrypt plaintext. Returns base64-encoded ciphertext."""
    box = SecretBox(key)
    nonce = nacl_random(box.NONCE_SIZE)
    ciphertext = box.encrypt(plaintext.encode(), nonce)
    return base64.urlsafe_b64encode(ciphertext).decode()


def decrypt(key: bytes, encrypted_b64: str) -> str:
    """Decrypt base64-encoded ciphertext."""
    box = SecretBox(key)
    ciphertext = base64.urlsafe_b64decode(encrypted_b64)
    plaintext = box.decrypt(ciphertext)
    return plaintext.decode()


def encode_key(key: bytes) -> str:
    """Encode key to base64url string for URL fragment."""
    return base64.urlsafe_b64encode(key).decode().rstrip("=")


def decode_key(key_b64: str) -> bytes:
    """Decode base64url key from URL fragment."""
    padded = key_b64 + "=" * (4 - len(key_b64) % 4)
    return base64.urlsafe_b64decode(padded)
