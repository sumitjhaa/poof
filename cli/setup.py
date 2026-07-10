from setuptools import setup, find_packages

setup(
    name="poof-cli",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "click>=8.0",
        "httpx>=0.28.0",
        "pynacl>=1.5.0",
    ],
    entry_points={
        "console_scripts": [
            "poof=poof.main:cli",
        ],
    },
)
