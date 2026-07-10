import click
import httpx

API_URL = "http://localhost:8000"


@click.group()
def audit():
    """View audit logs."""
    pass


@audit.command("list")
@click.option("--resource", default=None, help="Filter by resource ID")
@click.option("--event", default=None, help="Filter by event type")
@click.option("--limit", default=20, help="Number of entries to show")
def list_logs(resource: str, event: str, limit: int):
    """List audit log entries."""
    params = {"limit": limit}
    if resource:
        params["resource_id"] = resource
    if event:
        params["event"] = event

    try:
        resp = httpx.get(f"{API_URL}/api/audit/", params=params, timeout=10)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    data = resp.json()
    entries = data.get("entries", [])

    if not entries:
        click.echo("No audit entries found.")
        return

    click.echo(f"\n{'Timestamp':<20} {'Event':<20} {'Resource':<15} {'ID'}")
    click.echo("-" * 80)

    for entry in entries:
        ts = entry["timestamp"][:19].replace("T", " ")
        click.echo(f"{ts:<20} {entry['event']:<20} {entry['resource_type']:<15} {entry['resource_id'][:12]}...")


@audit.command("stats")
def show_stats():
    """Show audit log statistics."""
    try:
        resp = httpx.get(f"{API_URL}/api/audit/stats", timeout=10)
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    data = resp.json()
    click.echo(f"\nAudit Statistics:")
    click.echo(f"Total events: {data['total_events']}")
    click.echo(f"\nBy event type:")
    for event, count in data.get("by_event", {}).items():
        click.echo(f"  {event}: {count}")


@audit.command("export")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]), help="Export format")
@click.option("--output", "-o", default="audit_export", help="Output filename")
@click.option("--limit", default=1000, help="Max entries to export")
def export_logs(fmt: str, output: str, limit: int):
    """Export audit logs."""
    try:
        resp = httpx.get(
            f"{API_URL}/api/audit/export",
            params={"format": fmt, "limit": limit},
            timeout=30,
        )
        resp.raise_for_status()
    except httpx.RequestError as e:
        click.echo(f"Error: {e}", err=True)
        return

    filename = f"{output}.{fmt}"
    with open(filename, "w") as f:
        f.write(resp.text)

    click.echo(f"\n✓ Exported to {filename}")
