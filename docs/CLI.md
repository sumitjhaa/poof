# CLI Documentation

## Overview

Command-line interface for Poof secure secret sharing.

## Installation

```bash
cd cli
pip install -e .
```

## Project Structure

```
cli/
├── poof/
│   ├── __init__.py          # Package version
│   ├── main.py              # CLI entry point
│   ├── auth.py              # Password hashing
│   ├── commands/            # Command modules
│   │   ├── __init__.py
│   │   ├── create.py        # poof create
│   │   ├── read.py          # poof read
│   │   ├── files.py         # poof upload/download
│   │   ├── apikeys.py       # poof apikeys
│   │   └── audit.py         # poof audit
│   ├── crypto/              # Encryption module
│   │   ├── __init__.py
│   │   ├── generate.py
│   │   ├── encrypt.py
│   │   ├── decrypt.py
│   │   └── encode.py
│   └── utils/               # Utilities
│       ├── __init__.py
│       ├── expiry.py        # Expiry parsing
│       └── url.py           # URL parsing
└── setup.py
```

## Commands

### poof create

Create a new secret to share.

```bash
poof create [OPTIONS] [SECRET]
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-e, --expires` | Expiry time (5m, 1h, 1d, 7d) | 1h |
| `-v, --views` | Max views | 1 |
| `-p, --password` | Password protect | No |
| `-w, --webhook` | Webhook URL | None |

**Examples**:

```bash
# Create from argument
poof create "my-api-key-123"

# Create with 7 day expiry
poof create -e 7d "long-lived-secret"

# Create with password
poof create -p "sensitive-data"
# Prompts for password

# Create with webhook
poof create -w "https://hooks.example.com/notify" "secret"

# Create from stdin
echo "api-key" | poof create

# Pipe from another command
cat config.json | poof create -e 1d
```

**Output**:
```
Secret created!

Link: http://localhost:8000/s/abc123#key=XYZ789
Expires in: 1h
Max views: 1

⚠ Share this link before it expires!
```

---

### poof read

Read a secret from a Poof link.

```bash
poof read [OPTIONS] URL
```

**Examples**:

```bash
# Read secret
poof read "http://localhost:8000/s/abc123#key=XYZ789"

# Secret will be displayed and consumed
```

**Output**:
```
Secret:

my-api-key-123

---
Views remaining: 0
```

**Note**: Secret is consumed after reading (one-time access).

---

### poof upload

Upload a file to share securely.

```bash
poof upload [OPTIONS] FILE_PATH
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-e, --expires` | Expiry time | 1h |
| `-v, --views` | Max views | 1 |

**Examples**:

```bash
# Upload file
poof upload document.pdf

# Upload with 7 day expiry
poof upload -e 7d backup.zip

# Upload with multiple views
poof upload -v 3 shared-file.txt
```

**Output**:
```
File uploaded!

Link: http://localhost:8000/f/def456
Filename: document.pdf
Size: 1024000 bytes
Expires in: 1h
Max views: 1
```

**Limits**:
- Maximum file size: 10MB
- Supported formats: All

---

### poof download

Download a file from a Poof link.

```bash
poof download [OPTIONS] URL
```

**Options**:
| Option | Description |
|--------|-------------|
| `-o, --output` | Output filename |

**Examples**:

```bash
# Download file (keeps original filename)
poof download "http://localhost:8000/f/def456"

# Download with custom filename
poof download -o myfile.txt "http://localhost:8000/f/def456"
```

**Output**:
```
File downloaded: document.pdf
Size: 1024000 bytes
```

---

### poof apikeys

Manage API keys for third-party integration.

```bash
poof apikeys [OPTIONS] COMMAND [ARGS]...
```

#### poof apikeys create

Create a new API key.

```bash
poof apikeys create [OPTIONS] NAME
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--rate-limit` | Requests per hour | 100 |

**Examples**:

```bash
# Create API key
poof apikeys create "my-integration"

# Create with custom rate limit
poof apikeys create --rate-limit 500 "high-traffic"
```

**Output**:
```
API Key created!

Name: my-integration
Key: poof_abc123xyz...
Rate Limit: 100 req/hour

⚠ Save this key securely - it won't be shown again!
```

#### poof apikeys list

List all API keys.

```bash
poof apikeys list
```

**Output**:
```
Name                 Key             Rate       Status
------------------------------------------------------------
my-integration       poof_abc1...    100        ✓
high-traffic         poof_def4...    500        ✓
old-key              poof_ghi7...    100        ✗
```

#### poof apikeys revoke

Revoke an API key.

```bash
poof apikeys revoke KEY_ID
```

---

### poof audit

View audit logs.

```bash
poof audit [OPTIONS] COMMAND [ARGS]...
```

#### poof audit list

List audit log entries.

```bash
poof audit list [OPTIONS]
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--resource` | Filter by resource ID | None |
| `--event` | Filter by event type | None |
| `--limit` | Number of entries | 20 |

**Examples**:

```bash
# List recent events
poof audit list

# List only secret reads
poof audit list --event secret.read

# List 50 entries
poof audit list --limit 50
```

**Output**:
```
Timestamp            Event                Resource       ID
--------------------------------------------------------------------------------
2024-01-15 10:30:00  secret.created       secret         518e3d19-1e61...
2024-01-15 10:30:15  secret.read          secret         518e3d19-1e61...
2024-01-15 10:31:00  file.uploaded        file           4939fd61-4249...
```

#### poof audit stats

Show audit log statistics.

```bash
poof audit stats
```

**Output**:
```
Audit Statistics:
Total events: 42

By event type:
  secret.created: 15
  secret.read: 12
  file.uploaded: 8
  file.downloaded: 7
```

#### poof audit export

Export audit logs.

```bash
poof audit export [OPTIONS]
```

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Export format (json, csv) | json |
| `-o, --output` | Output filename | audit_export |
| `--limit` | Max entries | 1000 |

**Examples**:

```bash
# Export as JSON
poof audit export

# Export as CSV
poof audit export --format csv -o logs.csv
```

---

## Utilities

### utils/expiry.py

```python
def parse_expiry(value: str) -> int:
    """
    Parse expiry string to seconds.
    
    Supported formats:
    - 5m = 300 seconds
    - 1h = 3600 seconds
    - 1d = 86400 seconds
    - 7d = 604800 seconds
    """
```

### utils/url.py

```python
def parse_url(url: str) -> tuple[str, str]:
    """
    Parse Poof URL to extract secret_id and key.
    
    URL format: http://host/s/{id}#key={encoded_key}
    
    Returns:
        Tuple of (secret_id, key_b64)
    """
```

### auth.py

```python
def hash_password(password: str) -> tuple[str, str]:
    """Hash password with PBKDF2-SHA256."""

def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
    """Verify password against hash."""
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API URL | http://localhost:8000 |

---

## Error Handling

| Error | Description |
|-------|-------------|
| `Error: Secret not found or already consumed` | Secret was deleted or max views reached |
| `Error: Incorrect password` | Wrong password for protected secret |
| `Error: File exceeds 10MB limit` | File too large |
| `Error: Invalid URL format` | Malformed Poof URL |
| `Error: Connecting to server` | Backend unreachable |
