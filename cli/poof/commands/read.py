import sys
import click
import httpx

from poof.crypto import decode_key, decrypt
from poof.utils import parse_url

API_URL = "http://localhost:8000"


@click.command()
@click.argument("url")
def read(url: str):
    """Read a secret from a Poof link."""
    try:
        secret_id, key_b64 = parse_url(url)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    key = decode_key(key_b64)

    password = None
    try:
        resp = httpx.get(f"{API_URL}/api/secrets/{secret_id}", timeout=10)
        if resp.status_code == 403:
            password = click.prompt("Enter password", hide_input=True)
        elif resp.status_code == 404:
            click.echo("Error: Secret not found or already consumed", err=True)
            sys.exit(1)
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    try:
        params = {"password": password} if password else {}
        resp = httpx.get(f"{API_URL}/api/secrets/{secret_id}", params=params, timeout=10)
        if resp.status_code == 403:
            click.echo("Error: Incorrect password", err=True)
            sys.exit(1)
        if resp.status_code == 404:
            click.echo("Error: Secret not found or already consumed", err=True)
            sys.exit(1)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    data = resp.json()

    try:
        plaintext = decrypt(key, data["encrypted_data"])
    except Exception as e:
        click.echo(f"Error decrypting: {e}", err=True)
        sys.exit(1)

    click.echo(f"\nSecret:\n")
    click.echo(plaintext)
    click.echo(f"\n---")
    click.echo(f"Views remaining: {data.get('views_remaining', 0)}")
