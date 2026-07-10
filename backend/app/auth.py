import os
import hashlib
import hmac


def derive_key_from_password(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    """Derive encryption key from password using PBKDF2."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        iterations=100000,
        dklen=32,
    )
    return key, salt


def hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    """Hash password for storage. Returns (hash_hex, salt_hex)."""
    if salt is None:
        salt = os.urandom(16)
    key, _ = derive_key_from_password(password, salt)
    return key.hex(), salt.hex()


def verify_password(password: str, stored_hash: str, salt_hex: str) -> bool:
    """Verify password against stored hash."""
    salt = bytes.fromhex(salt_hex)
    key, _ = derive_key_from_password(password, salt)
    return hmac.compare_digest(key.hex(), stored_hash)
