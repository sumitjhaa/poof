import sys
import click
import httpx
from pathlib import Path

from poof.config import API_URL


@click.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("-e", "--expires", default="1h", help="Expiry time (5m, 1h, 7d)")
@click.option("-v", "--views", default=1, help="Max views (default: 1)")
def upload(file_path: str, expires: str, views: int):
    """Upload a file to share securely."""
    from poof.utils import parse_expiry

    path = Path(file_path)
    if not path.exists():
        click.echo(f"Error: File not found: {file_path}", err=True)
        sys.exit(1)

    file_size = path.stat().st_size
    if file_size > 10 * 1024 * 1024:
        click.echo("Error: File exceeds 10MB limit", err=True)
        sys.exit(1)

    expires_in = parse_expiry(expires)

    try:
        with open(file_path, "rb") as f:
            resp = httpx.post(
                f"{API_URL}/api/files/",
                files={"file": (path.name, f)},
                data={
                    "expires_in": expires_in,
                    "max_views": views,
                },
                timeout=30,
            )
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    data = resp.json()
    url = f"{API_URL}/f/{data['id']}"

    click.echo(f"\nFile uploaded!")
    click.echo(f"\nLink: {url}")
    click.echo(f"Filename: {data['filename']}")
    click.echo(f"Size: {data['size']} bytes")
    click.echo(f"Expires in: {expires}")
    click.echo(f"Max views: {views}")


@click.command()
@click.argument("url")
@click.option("-o", "--output", default=None, help="Output filename")
def download(url: str, output: str):
    """Download a file from a Poof link."""
    from poof.utils import parse_url

    try:
        parsed = url.replace("/f/", "/api/files/")
        file_id = parsed.split("/api/files/")[-1].split("?")[0]
    except Exception:
        click.echo("Error: Invalid URL format", err=True)
        sys.exit(1)

    try:
        resp = httpx.get(f"{API_URL}/api/files/{file_id}", timeout=30)

        if resp.status_code == 403:
            password = click.prompt("Enter password", hide_input=True)
            resp = httpx.get(
                f"{API_URL}/api/files/{file_id}",
                params={"password": password},
                timeout=30,
            )

        if resp.status_code == 404:
            click.echo("Error: File not found or already consumed", err=True)
            sys.exit(1)

        if resp.status_code == 403:
            click.echo("Error: Incorrect password", err=True)
            sys.exit(1)

        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error connecting to server: {e}", err=True)
        sys.exit(1)

    content_disposition = resp.headers.get("content-disposition", "")
    filename = output or "downloaded_file"

    if "filename=" in content_disposition:
        filename = content_disposition.split("filename=")[1].strip('"')

    with open(filename, "wb") as f:
        f.write(resp.content)

    click.echo(f"\nFile downloaded: {filename}")
    click.echo(f"Size: {len(resp.content)} bytes")
