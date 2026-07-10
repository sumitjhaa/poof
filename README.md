# Poof - Secure One-Time Secret Sharing

> End-to-end encrypted secret sharing with zero-knowledge architecture.

## What is Poof?

Poof is a secure secret sharing service where **the server never sees your plaintext data**. Secrets are encrypted client-side using AES-256-GCM, and the encryption key never leaves your device - it stays in the URL fragment (`#key=...`) which browsers never send to servers.

## Key Features

| Feature | Description |
|---------|-------------|
| **E2EE** | End-to-end encryption using AES-256-GCM |
| **Zero Knowledge** | Server never sees plaintext |
| **One-Time Access** | Secrets auto-delete after reading |
| **Password Protection** | Optional password-protected secrets |
| **File Sharing** | Upload/download encrypted files (10MB max) |
| **Webhooks** | Get notified when secrets expire |
| **Audit Log** | Track all secret lifecycle events |
| **API Keys** | Third-party integration support |
| **Browser Extension** | Chrome extension for quick access |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Backend   │────▶│  Database   │
│  (E2EE)     │     │  (FastAPI)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │            ┌──────┴──────┐
       │            │   Storage   │
       │            │  (Memory/DB)│
       │            └─────────────┘
       │
┌──────┴──────┐
│     CLI     │
│  (Click)    │
└─────────────┘
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. CLI

```bash
cd cli
pip install -e .
poof create "my-secret"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/secrets/` | Create secret |
| `GET` | `/api/secrets/{id}` | Read secret |
| `DELETE` | `/api/secrets/{id}` | Delete secret |
| `POST` | `/api/files/` | Upload file |
| `GET` | `/api/files/{id}` | Download file |
| `POST` | `/api/keys/` | Create API key |
| `GET` | `/api/keys/` | List API keys |
| `DELETE` | `/api/keys/{id}` | Revoke API key |
| `GET` | `/api/audit/` | List audit logs |
| `GET` | `/api/audit/stats` | Audit statistics |
| `GET` | `/api/audit/export` | Export logs |
| `GET` | `/health` | Health check |
| `GET` | `/api/info` | API info |

## CLI Commands

```bash
# Secrets
poof create "secret"              # Create secret
poof create -e 7d "secret"        # 7 day expiry
poof create -p "secret"           # Password protected
poof read "url#key=xxx"           # Read secret

# Files
poof upload file.txt              # Upload file
poof download "url"               # Download file

# API Keys
poof apikeys create "my-key"      # Create key
poof apikeys list                 # List keys
poof apikeys revoke <id>          # Revoke key

# Audit
poof audit list                   # View logs
poof audit stats                  # Statistics
poof audit export --format json   # Export logs
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Create secret |
| `/s/{id}` | Read secret |
| `/upload` | Upload file |
| `/api-keys` | Manage API keys |
| `/audit` | View audit logs |

## Deployment

### Free Infrastructure

| Service | Provider | Free Tier |
|---------|----------|-----------|
| PostgreSQL | Neon | 0.5 GB |
| Redis | Upstash | 256 MB |
| Backend | Render | 750 hrs |
| Frontend | Vercel | 100 GB |

### Deploy Steps

1. **Neon PostgreSQL**: neon.tech
2. **Upstash Redis**: upstash.com
3. **Render Backend**: render.com
4. **Vercel Frontend**: vercel.com

See `.env.example` for required environment variables.

## Security

- AES-256-GCM encryption
- PBKDF2 password hashing
- Rate limiting (10/min create, 30/min read)
- Security headers (HSTS, CSP, etc.)
- Key in URL fragment (never sent to server)

## License

MIT
