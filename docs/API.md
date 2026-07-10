# API Reference

## Base URL

```
http://localhost:8000          # Development
https://your-backend.onrender.com  # Production
```

## Authentication

### API Key Authentication

```bash
curl -H "Authorization: Bearer poof_your_api_key" \
     https://api.example.com/api/secrets/
```

## Endpoints

### Health Check

```
GET /health
```

**Response**:
```json
{
    "status": "ok",
    "version": "0.1.0"
}
```

---

### API Info

```
GET /api/info
```

**Response**:
```json
{
    "name": "Poof",
    "version": "0.1.0",
    "description": "Secure one-time secret sharing",
    "links": {
        "docs": "/docs",
        "github": "https://github.com/sumitjhaa/poof"
    }
}
```

---

### Create Secret

```
POST /api/secrets/
```

**Request Body**:
```json
{
    "encrypted_data": "hex_encoded_ciphertext",
    "expires_in": 3600,
    "max_views": 1,
    "password_hash": "optional_hex_hash",
    "password_salt": "optional_hex_salt",
    "webhook_url": "https://hooks.example.com/notify"
}
```

**Field Definitions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `encrypted_data` | string | Yes | Hex-encoded AES-256-GCM ciphertext |
| `expires_in` | integer | No | Seconds until expiry (60-2592000, default: 3600) |
| `max_views` | integer | No | Maximum views (1-10, default: 1) |
| `password_hash` | string | No | PBKDF2-SHA256 hash (hex) |
| `password_salt` | string | No | Salt for password hash (hex) |
| `webhook_url` | string | No | URL to notify on expiry |

**Response** (201 Created):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-15T11:30:00Z",
    "url": "/s/550e8400-e29b-41d4-a716-446655440000",
    "webhook_id": "optional_webhook_id"
}
```

**Rate Limit**: 10/minute

**Example**:
```bash
curl -X POST http://localhost:8000/api/secrets/ \
  -H "Content-Type: application/json" \
  -d '{
    "encrypted_data": "a1b2c3d4e5f6...",
    "expires_in": 3600,
    "max_views": 1
  }'
```

---

### Read Secret

```
GET /api/secrets/{id}?password=optional_password
```

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Secret UUID |

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | string | Password (if password-protected) |

**Response** (200 OK):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "encrypted_data": "a1b2c3d4e5f6...",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-15T11:30:00Z",
    "views_remaining": 0,
    "has_password": false
}
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| 403 | `password_required` | Password needed |
| 403 | `invalid_password` | Wrong password |
| 404 | `not_found` | Secret not found or expired |
| 410 | `consumed` | Max views reached |

**Rate Limit**: 30/minute

**Example**:
```bash
# Without password
curl http://localhost:8000/api/secrets/550e8400-e29b-41d4-a716-446655440000

# With password
curl "http://localhost:8000/api/secrets/550e8400-e29b-41d4-a716-446655440000?password=mypass"
```

---

### Delete Secret

```
DELETE /api/secrets/{id}
```

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Secret UUID |

**Response**: 204 No Content

**Error Response**:

| Status | Error | Description |
|--------|-------|-------------|
| 404 | `not_found` | Secret not found |

**Example**:
```bash
curl -X DELETE http://localhost:8000/api/secrets/550e8400-e29b-41d4-a716-446655440000
```

---

### Upload File

```
POST /api/files/
Content-Type: multipart/form-data
```

**Form Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | File to upload (max 10MB) |
| `expires_in` | integer | No | Seconds until expiry (default: 3600) |
| `max_views` | integer | No | Maximum views (default: 1) |
| `password_hash` | string | No | PBKDF2 hash |
| `password_salt` | string | No | Salt for hash |

**Response** (200 OK):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "document.pdf",
    "size": 1024000,
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-15T11:30:00Z",
    "url": "/f/550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `invalid_filename` | Filename required |
| 413 | `file_too_large` | Exceeds 10MB |

**Rate Limit**: 10/minute

**Example**:
```bash
curl -X POST http://localhost:8000/api/files/ \
  -F "file=@document.pdf" \
  -F "expires_in=3600" \
  -F "max_views=1"
```

---

### Download File

```
GET /api/files/{id}?password=optional_password
```

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | File UUID |

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | string | Password (if protected) |

**Response**: Binary file with headers:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"
```

**Rate Limit**: 30/minute

**Example**:
```bash
curl -O http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000
```

---

### Create API Key

```
POST /api/keys/
```

**Request Body**:
```json
{
    "name": "my-integration",
    "rate_limit": 100
}
```

**Response** (201 Created):
```json
{
    "id": "key_id",
    "key": "poof_abc123xyz...",
    "name": "my-integration",
    "created_at": "2024-01-15T10:30:00Z",
    "rate_limit": 100,
    "is_active": true
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/keys/ \
  -H "Content-Type: application/json" \
  -d '{"name": "my-key", "rate_limit": 100}'
```

---

### List API Keys

```
GET /api/keys/
```

**Response** (200 OK):
```json
{
    "keys": [
        {
            "id": "key_id",
            "key": "poof_abc...",
            "name": "my-key",
            "created_at": "2024-01-15T10:30:00Z",
            "rate_limit": 100,
            "is_active": true
        }
    ]
}
```

---

### Revoke API Key

```
DELETE /api/keys/{key_id}
```

**Response**: 200 OK
```json
{
    "status": "revoked"
}
```

---

### List Audit Logs

```
GET /api/audit/?resource_id=xxx&event=secret.created&limit=100
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource_id` | string | Filter by resource ID |
| `event` | string | Filter by event type |
| `resource_type` | string | Filter by type |
| `limit` | integer | Max results (1-1000) |

**Response** (200 OK):
```json
{
    "entries": [
        {
            "id": "entry_id",
            "event": "secret.created",
            "resource_id": "secret_id",
            "resource_type": "secret",
            "timestamp": "2024-01-15T10:30:00Z",
            "metadata": {"expires_in": 3600},
            "ip_address": "127.0.0.1"
        }
    ],
    "total": 1
}
```

---

### Export Audit Logs

```
GET /api/audit/export?format=json&limit=1000
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | `json` or `csv` |
| `limit` | integer | Max entries |

**Response**: JSON array or CSV text

---

### Audit Statistics

```
GET /api/audit/stats
```

**Response** (200 OK):
```json
{
    "total_events": 42,
    "by_event": {
        "secret.created": 15,
        "secret.read": 12,
        "file.uploaded": 8
    }
}
```

## Error Format

All errors follow consistent format:

```json
{
    "detail": {
        "error": "error_code",
        "message": "Human-readable description"
    }
}
```

## CORS

Allowed origins (configurable):
- `http://localhost:3000` (development)
- `https://your-frontend.vercel.app` (production)
