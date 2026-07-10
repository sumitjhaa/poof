import click

from poof import __version__
from poof.commands import create, read
from poof.commands.files import upload, download
from poof.commands.apikeys import apikeys
from poof.commands.audit import audit


@click.group()
@click.version_option(__version__, prog_name="poof")
def cli():
    """Poof - Share secrets securely. One-time access. Zero knowledge."""
    pass


cli.add_command(create)
cli.add_command(read)
cli.add_command(upload)
cli.add_command(download)
cli.add_command(apikeys)
cli.add_command(audit)


if __name__ == "__main__":
    cli()
