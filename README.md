# Poof

Secure one-time secret sharing with end-to-end encryption.

## Features

- Client-side encryption (AES-256-GCM)
- One-time access (secrets deleted after read)
- Configurable expiry (5 min to 30 days)
- Multiple view support (1-10 views)
- CLI + Web interface

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### CLI

```bash
cd cli
pip install -e .

# Create a secret
poof create "my-secret-password"

# Read a secret
poof read "http://localhost:8000/s/xxx#key=yyy"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API

```
POST /api/secrets     - Create secret
GET  /api/secrets/:id - Read secret (consumes it)
DELETE /api/secrets/:id - Delete secret
GET  /health          - Health check
```

## How It Works

1. You enter a secret
2. It's encrypted in your browser/CLI (AES-256-GCM)
3. Only the encrypted blob is sent to the server
4. The key stays in the URL fragment (never sent to server)
5. Secret is deleted after reading

## Deploy

### Free Tier Stack

| Service | Provider |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon |
| Cache | Upstash |

See `docs/` for detailed deployment guides.

## License

MIT
