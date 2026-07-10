import os


def generate_key() -> bytes:
    """Generate a random 256-bit key."""
    return os.urandom(32)
