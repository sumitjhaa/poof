import click
import httpx

from poof.config import API_URL


@click.group()
def apikeys():
    """Manage API keys."""
    pass


@apikeys.command("create")
@click.argument("name")
@click.option("--rate-limit", default=100, help="Requests per hour")
def create_key(name: str, rate_limit: int):
    """Create a new API key."""
    try:
        resp = httpx.post(
            f"{API_URL}/api/keys/",
            json={"name": name, "rate_limit": rate_limit},
            timeout=10,
        )
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    data = resp.json()
    click.echo(f"\nAPI Key created!")
    click.echo(f"\nName: {data['name']}")
    click.echo(f"Key: {data['key']}")
    click.echo(f"Rate Limit: {data['rate_limit']} req/hour")
    click.echo(f"\n⚠ Save this key securely - it won't be shown again!")


@apikeys.command("list")
def list_keys():
    """List all API keys."""
    try:
        resp = httpx.get(f"{API_URL}/api/keys/", timeout=10)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    data = resp.json()
    keys = data.get("keys", [])

    if not keys:
        click.echo("No API keys found.")
        return

    click.echo(f"\n{'Name':<20} {'Key':<15} {'Rate':<10} {'Status'}")
    click.echo("-" * 60)

    for key in keys:
        status = "✓" if key["is_active"] else "✗"
        click.echo(f"{key['name']:<20} {key['key']:<15} {key['rate_limit']:<10} {status}")


@apikeys.command("revoke")
@click.argument("key_id")
def revoke_key(key_id: str):
    """Revoke an API key."""
    try:
        resp = httpx.delete(f"{API_URL}/api/keys/{key_id}", timeout=10)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    click.echo(f"\n✓ API key revoked successfully!")
