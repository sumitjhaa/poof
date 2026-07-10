# Architecture & Security Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│     Browser     │       CLI       │     Browser Extension       │
│   (Next.js)     │     (Click)     │        (Chrome MV3)         │
│                 │                 │                             │
│  - WebCrypto    │  - cryptography │  - WebCrypto                │
│  - React        │  - httpx        │  - Service Worker           │
│  - TypeScript   │  - Click        │  - Content Script           │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         │    ┌────────────┴───────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                      FastAPI Backend                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Secrets  │  │  Files   │  │ API Keys │  │  Audit   │       │
│  │ Routes   │  │  Routes  │  │  Routes  │  │  Routes  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │               │
│  ┌────┴─────────────┴─────────────┴─────────────┴─────┐        │
│  │                    Middleware                        │        │
│  │  - Rate Limiting    - Security Headers              │        │
│  │  - CORS             - Audit Logging                 │        │
│  └─────────────────────────┬───────────────────────────┘        │
│                            │                                    │
│  ┌─────────────────────────┴───────────────────────────┐        │
│  │                    Services                         │        │
│  │  - Storage (Memory/PostgreSQL)                      │        │
│  │  - Crypto (AES-256-GCM)                             │        │
│  │  - Auth (PBKDF2)                                    │        │
│  │  - Webhooks                                         │        │
│  └─────────────────────────┬───────────────────────────┘        │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────┬───────────────────────────────────────┤
│     PostgreSQL (Neon)   │         In-Memory (Dev)               │
│                         │                                       │
│  - secrets table        │  - Python dict                        │
│  - Connection pooling   │  - Auto-cleanup                       │
│  - Async SQLAlchemy     │  - No persistence                     │
└─────────────────────────┴───────────────────────────────────────┘
```

## Data Flow

### Secret Creation Flow

```
1. Client generates AES-256-GCM key
2. Client encrypts secret locally
3. Client sends encrypted data to API
4. API stores encrypted data + metadata
5. API returns secret ID
6. Client constructs URL: /s/{id}#key={encoded_key}
7. Key stays in URL fragment (never sent to server)
```

### Secret Reading Flow

```
1. Client extracts key from URL fragment
2. Client extracts secret ID from URL path
3. Client sends GET request with ID only
4. API returns encrypted data
5. Client decrypts locally using key
6. API increments view count
7. If max views reached, secret is deleted
```

## Security Model

### End-to-End Encryption (E2EE)

```
┌──────────────────┐                    ┌──────────────────┐
│      Alice       │                    │       Bob        │
│                  │                    │                  │
│ 1. Enter secret  │                    │                  │
│ 2. Generate key  │                    │                  │
│ 3. Encrypt       │                    │                  │
│ 4. Send to API   │──── Encrypted ────▶│                  │
│                  │                    │ 5. Receive URL   │
│                  │                    │ 6. Extract key   │
│                  │                    │ 7. Decrypt       │
│                  │                    │ 8. Read secret   │
└──────────────────┘                    └──────────────────┘
         │                                       │
         │           ┌──────────────┐            │
         └──────────▶│    Server    │◀───────────┘
                     │              │
                     │ Stores only: │
                     │ - Encrypted  │
                     │ - ID         │
                     │ - Metadata   │
                     │              │
                     │ Never sees:  │
                     │ - Plaintext  │
                     │ - Key        │
                     └──────────────┘
```

### URL Fragment Security

```javascript
// URL: http://example.com/s/abc123#key=XYZ789
//                         ───── ─ ─────────
//                         │     │ │
//                         │     │ └─ Fragment (never sent to server)
//                         │     └─── Path (sent to server)
//                         └───────── Host
```

**Key Point**: Browsers never send URL fragments (`#...`) to servers. The key never leaves the client.

### Encryption Details

| Aspect | Value |
|--------|-------|
| Algorithm | AES-256-GCM |
| Key Size | 256 bits (32 bytes) |
| Nonce | 96 bits (12 bytes) |
| Tag | 128 bits (16 bytes) |
| Key Derivation | Random (not derived) |

### Password Hashing

| Aspect | Value |
|--------|-------|
| Algorithm | PBKDF2-SHA256 |
| Iterations | 100,000 |
| Salt Size | 128 bits (16 bytes) |
| Hash Size | 256 bits (32 bytes) |

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Create Secret | 10 | 1 minute |
| Read Secret | 30 | 1 minute |
| Upload File | 10 | 1 minute |

## Storage Schema

### PostgreSQL Table

```sql
CREATE TABLE secrets (
    id UUID PRIMARY KEY,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER,
    views_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    password_salt TEXT
);
```

### In-Memory Structure

```python
{
    "id": {
        "id": "uuid",
        "encrypted_data": "hex_string",
        "created_at": datetime,
        "expires_at": datetime,
        "max_views": 1,
        "views_count": 0,
        "is_deleted": False,
        "password_hash": "hex" | None,
        "password_salt": "hex" | None
    }
}
```

## Audit Events

| Event | Description |
|-------|-------------|
| `secret.created` | New secret created |
| `secret.read` | Secret accessed |
| `secret.deleted` | Secret deleted |
| `secret.expired` | Secret expired |
| `file.uploaded` | File uploaded |
| `file.downloaded` | File downloaded |
| `apikey.created` | API key created |
| `apikey.revoked` | API key revoked |

## Webhook Format

```json
{
    "event": "secret.expired",
    "secret_id": "abc123",
    "webhook_id": "xyz789"
}
```

## Security Headers

| Header | Value |
|--------|-------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | no-referrer |
| Permissions-Policy | geolocation=(), camera=(), microphone=() |

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Server compromise | E2EE - no plaintext on server |
| Man-in-middle | HTTPS + URL fragment |
| Brute force | Rate limiting |
| Password guessing | PBKDF2 with 100k iterations |
| Replay attacks | One-time access (max views) |
| Data leakage | Auto-expiry + auto-deletion |
