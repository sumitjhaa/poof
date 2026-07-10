import sys
import click
import httpx

from poof.config import API_URL
from poof.crypto import generate_key, encrypt, encode_key
from poof.auth import hash_password
from poof.utils import parse_expiry


@click.command()
@click.argument("secret", required=False)
@click.option("-e", "--expires", default="1h", help="Expiry time (5m, 1h, 1d)")
@click.option("-v", "--views", default=1, help="Max views (default: 1)")
@click.option("-p", "--password", is_flag=True, help="Password protect this secret")
@click.option("-w", "--webhook", default=None, help="Webhook URL for expiration notification")
def create(secret: str, expires: str, views: int, password: bool, webhook: str):
    """Create a new secret to share."""
    expires_in = parse_expiry(expires)

    if not secret:
        if sys.stdin.isatty():
            secret = click.prompt("Enter your secret", hide_input=True)
        else:
            secret = sys.stdin.read().strip()

    if not secret:
        click.echo("Error: No secret provided", err=True)
        sys.exit(1)

    password_hash = None
    password_salt = None
    if password:
        pwd = click.prompt("Enter password", hide_input=True)
        password_hash, password_salt = hash_password(pwd)

    key = generate_key()
    encrypted = encrypt(key, secret)

    try:
        resp = httpx.post(
            f"{API_URL}/api/secrets/",
            json={
                "encrypted_data": encrypted,
                "expires_in": expires_in,
                "max_views": views,
                "password_hash": password_hash,
                "password_salt": password_salt,
                "webhook_url": webhook,
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
    if password:
        click.echo(f"Password: Yes")
    if webhook:
        click.echo(f"Webhook: Yes (notification on expiry)")
    click.echo(f"\n⚠ Share this link before it expires!")
