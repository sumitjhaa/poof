import click

from poof import __version__
from poof.commands import create, read
from poof.commands.files import upload, download
from poof.commands.apikeys import apikeys


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


if __name__ == "__main__":
    cli()
