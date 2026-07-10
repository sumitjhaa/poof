# Backend Documentation

## Overview

FastAPI-based backend providing REST API for secure secret sharing.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings management
│   ├── models.py            # Pydantic models
│   ├── crypto/              # Encryption module
│   │   ├── __init__.py
│   │   ├── generate.py      # Key generation
│   │   ├── encrypt.py       # AES-256-GCM encryption
│   │   ├── decrypt.py       # AES-256-GCM decryption
│   │   └── encode.py        # Key encoding for URLs
│   ├── storage/             # Storage module
│   │   ├── __init__.py      # Storage facade
│   │   ├── memory.py        # In-memory storage
│   │   └── postgres.py      # PostgreSQL storage
│   ├── routes/              # API routes
│   │   ├── __init__.py      # Router assembly
│   │   ├── create.py        # POST /api/secrets
│   │   ├── read.py          # GET /api/secrets/{id}
│   │   ├── delete.py        # DELETE /api/secrets/{id}
│   │   ├── files.py         # File upload/download
│   │   ├── api_keys.py      # API key management
│   │   └── audit.py         # Audit log endpoints
│   ├── auth.py              # Password hashing (PBKDF2)
│   ├── audit.py             # Audit log storage
│   ├── api_keys.py          # API key management
│   ├── database.py          # PostgreSQL connection
│   ├── limiter.py           # Rate limiting
│   ├── security.py          # Security headers
│   └── webhooks.py          # Webhook notifications
├── tests/
│   ├── test_crypto.py       # 5 crypto tests
│   └── test_api.py          # 6 API tests
├── requirements.txt
└── Procfile
```

## Modules

### app/main.py

**Purpose**: FastAPI application entry point

```python
app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.debug else None,
    lifespan=lifespan,
)
```

**Features**:
- CORS middleware configuration
- Security headers middleware
- Rate limiting middleware
- Background cleanup task for expired secrets
- Health check and info endpoints

**Endpoints**:
- `GET /health` - Health check
- `GET /api/info` - API information

---

### app/config.py

**Purpose**: Environment-based configuration

```python
class Settings(BaseSettings):
    app_name: str = "Poof"
    database_url: str | None = None
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]
```

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `DEBUG` - Enable debug mode
- `ALLOWED_ORIGINS` - CORS allowed origins

---

### app/models.py

**Purpose**: Pydantic data models

**Models**:

```python
class SecretCreate(BaseModel):
    encrypted_data: str      # Encrypted content (hex)
    expires_in: int          # Seconds until expiry (60-2592000)
    max_views: int           # Max views (1-10)
    password_hash: str | None
    password_salt: str | None
    webhook_url: str | None

class SecretResponse(BaseModel):
    id: str
    created_at: datetime
    expires_at: datetime
    url: str
    webhook_id: str | None

class SecretRead(BaseModel):
    id: str
    encrypted_data: str
    created_at: datetime
    expires_at: datetime
    views_remaining: int
    has_password: bool

class ErrorResponse(BaseModel):
    error: str
    message: str
```

---

### app/crypto/

**Purpose**: AES-256-GCM encryption utilities

#### crypto/generate.py

```python
def generate_key() -> bytes:
    """Generate a 256-bit (32-byte) encryption key."""
    return secrets.token_bytes(32)
```

#### crypto/encrypt.py

```python
def encrypt(key: bytes, plaintext: str) -> str:
    """
    Encrypt plaintext using AES-256-GCM.
    
    Args:
        key: 32-byte encryption key
        plaintext: String to encrypt
        
    Returns:
        Hex-encoded ciphertext (12-byte nonce + encrypted data + 16-byte tag)
    """
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode())
    return (cipher.nonce + ciphertext + tag).hex()
```

#### crypto/decrypt.py

```python
def decrypt(key: bytes, ciphertext_hex: str) -> str:
    """
    Decrypt ciphertext using AES-256-GCM.
    
    Args:
        key: 32-byte encryption key
        ciphertext_hex: Hex-encoded ciphertext
        
    Returns:
        Decrypted plaintext string
        
    Raises:
        ValueError: If decryption fails (wrong key or tampered data)
    """
    data = bytes.fromhex(ciphertext_hex)
    nonce, ciphertext, tag = data[:12], data[12:-16], data[-16:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag).decode()
```

#### crypto/encode.py

```python
def encode_key(key: bytes) -> str:
    """Encode key to URL-safe base64."""
    return base64.urlsafe_b64encode(key).rstrip(b'=').decode()

def decode_key(encoded: str) -> bytes:
    """Decode URL-safe base64 key."""
    padding = 4 - len(encoded) % 4
    return base64.urlsafe_b64decode(encoded + '=' * padding)
```

---

### app/storage/

**Purpose**: Secret storage abstraction

#### storage/__init__.py

```python
class Storage:
    """Storage facade - uses PostgreSQL if DATABASE_URL set, else memory."""
    
    async def create(self, id, encrypted_data, expires_in, max_views, 
                     password_hash, password_salt) -> dict
    async def get(self, id: str) -> dict | None
    async def increment_view(self, id: str) -> dict | None
    async def delete(self, id: str) -> bool
    async def cleanup_expired(self) -> int
```

#### storage/memory.py

**Purpose**: In-memory storage for development

```python
class MemoryStorage:
    def __init__(self):
        self.secrets: dict[str, dict] = {}
    
    def create(self, id, encrypted_data, expires_in, max_views, 
               password_hash, password_salt) -> dict
    def get(self, id: str) -> dict | None
    def increment_view(self, id: str) -> dict | None
    def delete(self, id: str) -> bool
    def cleanup_expired(self) -> int
```

**Features**:
- Automatic expiry checking on read
- View count tracking
- Soft delete (is_deleted flag)

#### storage/postgres.py

**Purpose**: PostgreSQL storage for production

```python
class PostgresStorage:
    async def init(self) -> bool
    async def create(self, id, encrypted_data, expires_in, max_views, 
                     password_hash, password_salt) -> dict
    async def get(self, id: str) -> dict | None
    async def increment_view(self, id: str) -> dict | None
    async def delete(self, id: str) -> bool
    async def cleanup_expired(self) -> int
```

---

### app/routes/

**Purpose**: API endpoint handlers

#### routes/create.py

```python
@router.post("/", response_model=SecretResponse, status_code=201)
@limiter.limit("10/minute")
async def create_secret(request: Request, data: SecretCreate):
    """
    Create a new secret.
    
    - Generates UUID for secret
    - Stores encrypted data
    - Registers webhook if provided
    - Logs audit event
    - Returns secret URL
    """
```

#### routes/read.py

```python
@router.get("/{id}", response_model=SecretRead)
@limiter.limit("30/minute")
async def read_secret(request: Request, id: str, password: str = None):
    """
    Read a secret.
    
    - Validates password if required
    - Checks views remaining
    - Increments view count
    - Logs audit event
    - Returns encrypted data for client decryption
    """
```

#### routes/delete.py

```python
@router.delete("/{id}", status_code=204)
async def delete_secret(request: Request, id: str):
    """
    Delete a secret.
    
    - Soft deletes the secret
    - Logs audit event
    """
```

#### routes/files.py

```python
@router.post("/")
async def upload_file(request: Request, file: UploadFile, ...):
    """
    Upload a file (max 10MB).
    
    - Validates file size
    - Stores file data as hex
    - Logs audit event
    """

@router.get("/{id}")
async def download_file(request: Request, id: str, password: str = None):
    """
    Download a file.
    
    - Validates password if required
    - Returns file with original filename
    - Logs audit event
    """
```

#### routes/api_keys.py

```python
@router.post("/", response_model=APIKeyResponse, status_code=201)
async def create_api_key(data: APIKeyCreate):
    """Create a new API key with custom rate limit."""

@router.get("/", response_model=APIKeyListResponse)
async def list_api_keys():
    """List all API keys."""

@router.delete("/{key_id}")
async def revoke_api_key(key_id: str):
    """Revoke an API key."""
```

#### routes/audit.py

```python
@router.get("/")
async def list_audit_logs(resource_id, event, resource_type, limit):
    """List audit log entries with filters."""

@router.get("/export")
async def export_audit_logs(format: str, limit: int):
    """Export audit logs as JSON or CSV."""

@router.get("/stats")
async def audit_stats():
    """Get audit log statistics."""
```

---

### app/auth.py

**Purpose**: Password hashing with PBKDF2

```python
def hash_password(password: str) -> tuple[str, str]:
    """
    Hash password with PBKDF2-SHA256.
    
    Args:
        password: Plain text password
        
    Returns:
        Tuple of (hash_hex, salt_hex)
    """
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return key.hex(), salt.hex()

def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
    """
    Verify password against hash.
    
    Args:
        password: Plain text password
        hash_hex: Stored hash (hex)
        salt_hex: Stored salt (hex)
        
    Returns:
        True if password matches
    """
    salt = bytes.fromhex(salt_hex)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return key.hex() == hash_hex
```

---

### app/audit.py

**Purpose**: Audit log storage and querying

```python
class AuditEvent(str, Enum):
    SECRET_CREATED = "secret.created"
    SECRET_READ = "secret.read"
    SECRET_DELETED = "secret.deleted"
    SECRET_EXPIRED = "secret.expired"
    FILE_UPLOADED = "file.uploaded"
    FILE_DOWNLOADED = "file.downloaded"
    API_KEY_CREATED = "apikey.created"
    API_KEY_REVOKED = "apikey.revoked"

class AuditLog:
    def log(self, event, resource_id, resource_type, 
            metadata=None, ip_address=None, user_agent=None) -> AuditEntry
    
    def query(self, resource_id=None, event=None, 
              resource_type=None, limit=100) -> list[AuditEntry]
    
    def export_json(self, limit=1000) -> list[dict]
```

---

### app/api_keys.py

**Purpose**: API key management

```python
class APIKey:
    id: str
    key: str
    name: str
    created_at: datetime
    last_used: datetime | None
    is_active: bool
    requests_count: int
    rate_limit: int

class APIKeyStore:
    def generate(self, name: str, rate_limit: int = 100) -> APIKey
    def validate(self, key: str) -> APIKey | None
    def revoke(self, key_id: str) -> bool
    def list_keys(self) -> list[APIKey]
```

---

### app/webhooks.py

**Purpose**: Webhook notifications

```python
class Webhook:
    id: str
    url: str
    secret_id: str
    event: str
    created_at: str

class WebhookStore:
    def add(self, webhook: Webhook)
    def get_by_secret(self, secret_id: str) -> list[Webhook]
    def remove(self, webhook_id: str)

async def notify_webhooks(secret_id: str, event: str):
    """Send webhook notifications for an event."""
```

---

### app/database.py

**Purpose**: PostgreSQL connection management

```python
async def init_db() -> bool:
    """
    Initialize database connection.
    
    Returns:
        True if connected, False if using memory storage
    """
```

---

### app/limiter.py

**Purpose**: Rate limiting with SlowAPI

```python
limiter = Limiter(key_func=get_remote_address)
```

**Limits**:
- Create secret: 10/minute
- Read secret: 30/minute
- Upload file: 10/minute

---

### app/security.py

**Purpose**: Security headers middleware

```python
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses:
    - Strict-Transport-Security
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Referrer-Policy: no-referrer
    - Permissions-Policy
    """
```

## Testing

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

**Test Coverage**:
- `test_crypto.py`: Key generation, encryption/decryption, encoding
- `test_api.py`: CRUD operations, rate limiting, error handling
