import secrets
from datetime import datetime, timezone
from dataclasses import dataclass


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
