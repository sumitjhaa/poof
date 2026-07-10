from urllib.parse import urlparse


def parse_url(url: str) -> tuple[str, str]:
    """Parse Poof URL to extract secret_id and key."""
    parsed = urlparse(url)
    path_parts = parsed.path.strip("/").split("/")

    if len(path_parts) < 2 or path_parts[0] != "s":
        raise ValueError("Invalid Poof URL format")

    secret_id = path_parts[-1]

    fragment = parsed.fragment
    if not fragment.startswith("key="):
        raise ValueError("Missing key in URL fragment")

    key_b64 = fragment[4:]
    return secret_id, key_b64
