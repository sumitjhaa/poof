import secrets
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from fastapi import Request, HTTPException


@dataclass
class APIKey:
    id: str
    key: str
    name: str
    created_at: datetime
    last_used: datetime | None = None
    is_active: bool = True
    requests_count: int = 0
    rate_limit: int = 100  # requests per hour


class RateLimitBucket:
    """Simple sliding-window rate limiter for API keys."""
    def __init__(self):
        self._requests: dict[str, list[datetime]] = {}

    def check(self, key_id: str, limit: int, window_seconds: int = 3600) -> bool:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=window_seconds)

        if key_id not in self._requests:
            self._requests[key_id] = []

        self._requests[key_id] = [t for t in self._requests[key_id] if t > cutoff]

        if len(self._requests[key_id]) >= limit:
            return False

        self._requests[key_id].append(now)
        return True


rate_limiter = RateLimitBucket()


class APIKeyStore:
    def __init__(self):
        self._keys: dict[str, APIKey] = {}

    def generate(self, name: str, rate_limit: int = 100) -> APIKey:
        key = f"poof_{secrets.token_urlsafe(32)}"
        key_id = secrets.token_urlsafe(16)

        api_key = APIKey(
            id=key_id,
            key=key,
            name=name,
            created_at=datetime.now(timezone.utc),
            rate_limit=rate_limit,
        )

        self._keys[key_id] = api_key
        return api_key

    def validate(self, key: str) -> APIKey | None:
        for api_key in self._keys.values():
            if api_key.key == key and api_key.is_active:
                api_key.last_used = datetime.now(timezone.utc)
                api_key.requests_count += 1
                return api_key
        return None

    def revoke(self, key_id: str) -> bool:
        if key_id in self._keys:
            self._keys[key_id].is_active = False
            return True
        return False

    def list_keys(self) -> list[APIKey]:
        return list(self._keys.values())

    def get_by_id(self, key_id: str) -> APIKey | None:
        return self._keys.get(key_id)


api_key_store = APIKeyStore()


def get_api_key_from_header(authorization: str | None) -> str | None:
    if not authorization:
        return None

    if authorization.startswith("Bearer "):
        return authorization[7:]

    return authorization


async def verify_api_key(request: Request) -> APIKey | None:
    """Optional dependency: extracts and validates API key from Authorization header.
    Returns the APIKey if valid, None otherwise. Never rejects the request."""
    auth = request.headers.get("Authorization")
    key = get_api_key_from_header(auth)

    if key:
        api_key = api_key_store.validate(key)
        if api_key:
            request.state.api_key = api_key
            return api_key

    request.state.api_key = None
    return None


def require_rate_limit(request: Request, api_key: APIKey | None):
    """Check rate limit: API key gets its own limit, otherwise pass through to slowapi."""
    if api_key:
        if not rate_limiter.check(api_key.id, api_key.rate_limit):
            raise HTTPException(
                status_code=429,
                detail={"error": "rate_limited", "message": f"Rate limit exceeded ({api_key.rate_limit}/hour)"}
            )
