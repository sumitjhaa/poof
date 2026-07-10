import base64


def encode_key(key: bytes) -> str:
    """Encode key to base64url string for URL fragment."""
    return base64.urlsafe_b64encode(key).decode().rstrip("=")


def decode_key(key_b64: str) -> bytes:
    """Decode base64url key from URL fragment."""
    padded = key_b64 + "=" * (4 - len(key_b64) % 4)
    return base64.urlsafe_b64decode(padded)
