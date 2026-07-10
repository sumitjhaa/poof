# Poof - Technical Requirements Document (TRD)

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web UI     │  │   CLI Tool   │  │   Browser Extension  │  │
│  │  (Next.js)   │  │   (Python)   │  │      (Future)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                     │
│         └────────┬────────┘                                     │
│                  │                                              │
│    ┌─────────────▼─────────────┐                               │
│    │   Shared Crypto Module    │                               │
│    │   (XChaCha20-Poly1305)    │                               │
│    └─────────────┬─────────────┘                               │
└──────────────────┼──────────────────────────────────────────────┘
                   │
                   │ HTTPS (Encrypted Payloads Only)
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                       SERVER LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Server                         │   │
│  │  (Render - Free Tier)                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ POST /create │  │ GET /{id}   │  │ DELETE /{id}    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │                    Data Layer (FREE)                      │   │
│  │  ┌────────────────┐  ┌────────────────┐                  │   │
│  │  │   Neon PG      │  │  Upstash Redis │                  │   │
│  │  │  (Free Tier)   │  │  (Free Tier)   │                  │   │
│  │  │  - 0.5 GB      │  │  - 256 MB      │                  │   │
│  │  │  - 100 CU-hr   │  │  - 500K cmd    │                  │   │
│  │  └────────────────┘  └────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 + Bun | SSR for SEO, Bun for speed |
| **Backend** | Python 3.11+ + FastAPI | Async, type-safe, fast |
| **CLI** | Python + Click/Typer | Consistent with backend |
| **Database** | Neon PostgreSQL (Free) | 0.5 GB, autoscale, no pause |
| **Cache** | Upstash Redis (Free) | 256 MB, serverless, HTTP |
| **Crypto** | XChaCha20-Poly1305 | AEAD, safe nonce handling |
| **Hosting** | Vercel (Free) | Frontend deployment |

### Free Tier Limits

| Service | Free Allowance | Upgrade Path |
|---------|----------------|--------------|
| **Neon PG** | 0.5 GB storage, 100 CU-hours/month | Pay-as-you-go |
| **Upstash Redis** | 256 MB, 500K commands/month | $0.20/100K commands |
| **Render** | 750 hrs/month, custom domains | $7/month Starter |
| **Vercel** | 100 GB bandwidth, 1000 build mins | $20/month Pro |

## 3. Cryptographic Design

### 3.1 Encryption Scheme

**Algorithm**: XChaCha20-Poly1305 (AEAD)

**Why XChaCha20?**
- Better nonce handling than AES-GCM (192-bit random nonce)
- No nonce reuse risks
- Fast in software (no AES-NI required)
- Used by libsodium/NACL

### 3.2 Key Derivation

```
User Secret (password) 
    │
    ▼
Argon2id(password, random_salt, ops=3, mem=64MB)
    │
    ▼
Derived Key (256-bit)
```

### 3.3 Encryption Flow (Client)

```python
# 1. Generate random 256-bit key
key = generate_key()  # os.urandom(32)

# 2. Encrypt the secret
nonce = generate_nonce()  # os.urandom(24)
ciphertext = encrypt(key, nonce, plaintext)

# 3. Encode for transmission
encrypted_payload = base64_encode(nonce + ciphertext)

# 4. Send to server (server never sees key!)
POST /api/secrets {
    "encrypted_data": encrypted_payload,
    "expires_in": 3600,  # seconds
    "max_views": 1
}
```

### 3.4 Decryption Flow (Client)

```python
# 1. Fetch encrypted blob from server
response = GET /api/secrets/{uuid}
encrypted_data = response.encrypted_data

# 2. Get key from URL fragment (never sent to server)
# URL format: https://poof.example.com/s/{uuid}#key={base64_key}
key = extract_key_from_url_fragment()

# 3. Decrypt
nonce, ciphertext = decode(encrypted_data)
plaintext = decrypt(key, nonce, ciphertext)

# 4. Display to user (then server deletes the secret)
```

### 3.5 Key Distribution

**Critical**: The encryption key is NEVER sent to the server.

```
URL Structure:
https://poof.example.com/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890#key=base64url_encoded_key

Fragment (#key=...) is:
- Not sent in HTTP requests
- Stored in browser only
- Can be accessed by JavaScript
```

## 4. API Design

### 4.1 Endpoints

#### Create Secret
```http
POST /api/secrets
Content-Type: application/json

{
    "encrypted_data": "base64_encoded_encrypted_blob",
    "expires_in": 3600,        // Optional, default: 3600
    "max_views": 1,            // Optional, default: 1
    "passphrase_hash": "..."   // Optional, for password protection
}

Response:
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-15T11:30:00Z",
    "url": "https://poof.example.com/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### Read Secret
```http
GET /api/secrets/{id}

Response (200 OK):
{
    "encrypted_data": "...",
    "created_at": "...",
    "expires_at": "...",
    "views_remaining": 1
}

Response (410 Gone):
{
    "error": "secret_not_found",
    "message": "This secret has been deleted or expired"
}
```

#### Delete Secret (Manual)
```http
DELETE /api/secrets/{id}

Response (204 No Content)
```

### 4.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/secrets | 10 | 1 minute |
| GET /api/secrets/{id} | 30 | 1 minute |

### 4.3 Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid request body |
| 404 | Secret not found (or expired/deleted) |
| 410 | Secret has been consumed |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## 5. Data Models

### 5.1 PostgreSQL Schema

```sql
CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_data TEXT NOT NULL,  -- Encrypted blob (never plaintext!)
    passphrase_hash VARCHAR(255),  -- Optional Argon2 hash
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    max_views INT DEFAULT 1,
    views_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_secrets_expires ON secrets(expires_at);
CREATE INDEX idx_secrets_is_deleted ON secrets(is_deleted);
```

### 5.2 Redis Cache

```
Key: secret:{id}
Value: {
    "encrypted_data": "...",
    "expires_at": "...",
    "views_remaining": 1
}
TTL: Match secret expiry
```

## 6. Security Considerations

### 6.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Server compromise | E2EE - no plaintext on server |
| Brute force links | UUID v4 (128-bit randomness) |
| Replay attacks | One-time use, deleted after read |
| Timing attacks | Constant-time comparisons |
| XSS | Input sanitization, CSP headers |
| MITM | HTTPS only, HSTS headers |

### 6.2 Security Headers

```python
# FastAPI middleware
SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=()"
}
```

### 6.3 Logging Policy

**ALWAYS LOG:**
- Secret creation timestamp
- Secret access timestamp
- IP addresses (for rate limiting)
- Error codes

**NEVER LOG:**
- Encrypted data content
- Encryption keys
- Plaintext secrets
- URL fragments (#key=...)

## 7. Performance Requirements

| Metric | Target |
|--------|--------|
| Secret creation latency | < 50ms |
| Secret retrieval latency | < 50ms |
| Encryption time (client) | < 100ms |
| Decryption time (client) | < 100ms |
| Max concurrent connections | 10,000 |
| Database size per secret | < 10KB |

## 8. Deployment Architecture

### Free Tier Setup (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      FREE TIER STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Vercel     │    │   Neon PG    │    │  Upstash     │   │
│  │   (Free)     │    │   (Free)     │    │  Redis       │   │
│  │              │    │              │    │  (Free)      │   │
│  │  - Next.js   │    │  - 0.5 GB    │    │  - 256 MB    │   │
│  │  - Frontend  │    │  - 100 CU-hr │    │  - 500K cmd  │   │
│  │  - SSL       │    │  - Auto-scale│    │  - HTTP API  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Render (Free)                        │   │
│  │  - FastAPI server                                     │   │
│  │  - 750 hrs/month                                      │   │
│  │  - Custom domains                                     │   │
│  │  - Auto-deploy from GitHub                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

```env
# Backend (.env - Render)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/poof
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://poof.vercel.app

# Frontend (.env.local - Vercel)
NEXT_PUBLIC_API_URL=https://poof.onrender.com
```

---

*Version: 1.0 | Status: Draft | Last Updated: 2024*
