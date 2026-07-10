import sys
from urllib.parse import urlparse, parse_qs

import click
import httpx

from poof import __version__
from poof.crypto import generate_key, encrypt, encode_key, decode_key, decrypt


API_URL = "http://localhost:8000"


@click.group()
@click.version_option(__version__, prog_name="poof")
def cli():
    """Poof - Share secrets securely. One-time access. Zero knowledge."""
    pass


@cli.command()
@click.argument("secret", required=False)
@click.option("-e", "--expires", default="1h", help="Expiry time (5m, 1h, 1d)")
@click.option("-v", "--views", default=1, help="Max views (default: 1)")
def create(secret: str, expires: str, views: int):
    """Create a new secret to share."""
    # Parse expiry
    expires_in = parse_expiry(expires)

    # Get secret from argument or stdin
    if not secret:
        if sys.stdin.isatty():
            secret = click.prompt("Enter your secret", hide_input=True)
        else:
            secret = sys.stdin.read().strip()

    if not secret:
        click.echo("Error: No secret provided", err=True)
        sys.exit(1)

    # Encrypt
    key = generate_key()
    encrypted = encrypt(key, secret)

    # Send to API
    try:
        resp = httpx.post(
            f"{API_URL}/api/secrets",
            json={
                "encrypted_data": encrypted,
                "expires_in": expires_in,
                "max_views": views,
            },
            timeout=10,
        )
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    data = resp.json()
    key_encoded = encode_key(key)
    url = f"{API_URL}/s/{data['id']}#key={key_encoded}"

    click.echo(f"\nSecret created!\n")
    click.echo(f"Link: {url}")
    click.echo(f"\nExpires in: {expires}")
    click.echo(f"Max views: {views}")
    click.echo(f"\n⚠ Share this link before it expires!")


def parse_expiry(value: str) -> int:
    """Parse human-readable expiry to seconds."""
    units = {"m": 60, "h": 3600, "d": 86400}
    if value[-1] in units:
        return int(value[:-1]) * units[value[-1]]
    return int(value)


@cli.command()
@click.argument("url")
def read(url: str):
    """Read a secret from a Poof link."""
    # Parse URL to extract ID and key
    parsed = urlparse(url)
    path_parts = parsed.path.strip("/").split("/")
    
    if len(path_parts) < 2 or path_parts[0] != "s":
        click.echo("Error: Invalid Poof URL format", err=True)
        sys.exit(1)

    secret_id = path_parts[-1]
    
    # Extract key from fragment
    fragment = parsed.fragment
    if not fragment.startswith("key="):
        click.echo("Error: Missing key in URL fragment", err=True)
        sys.exit(1)

    key_b64 = fragment[4:]
    key = decode_key(key_b64)

    # Fetch encrypted data
    try:
        resp = httpx.get(
            f"{API_URL}/api/secrets/{secret_id}",
            timeout=10,
        )
        if resp.status_code == 404:
            click.echo("Error: Secret not found or already consumed", err=True)
            sys.exit(1)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    data = resp.json()
    
    # Decrypt
    try:
        plaintext = decrypt(key, data["encrypted_data"])
    except Exception as e:
        click.echo(f"Error decrypting: {e}", err=True)
        sys.exit(1)

    click.echo(f"\nSecret:\n")
    click.echo(plaintext)
    click.echo(f"\n---")
    click.echo(f"Views remaining: {data.get('views_remaining', 0)}")


if __name__ == "__main__":
    cli()
