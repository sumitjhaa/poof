from datetime import datetime, timezone
from uuid import UUID


class InMemoryStorage:
    def __init__(self):
        self.secrets: dict[str, dict] = {}

    def create(self, id: str, encrypted_data: str, expires_in: int, max_views: int) -> dict:
        now = datetime.now(timezone.utc)
        secret = {
            "id": id,
            "encrypted_data": encrypted_data,
            "created_at": now,
            "expires_at": datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc),
            "max_views": max_views,
            "views_count": 0,
            "is_deleted": False,
        }
        self.secrets[id] = secret
        return secret

    def get(self, id: str) -> dict | None:
        secret = self.secrets.get(id)
        if not secret:
            return None
        if secret["is_deleted"]:
            return None
        if datetime.now(timezone.utc) > secret["expires_at"]:
            self.delete(id)
            return None
        return secret

    def increment_view(self, id: str) -> dict | None:
        secret = self.get(id)
        if not secret:
            return None
        secret["views_count"] += 1
        if secret["views_count"] >= secret["max_views"]:
            self.delete(id)
        return secret

    def delete(self, id: str) -> bool:
        if id in self.secrets:
            self.secrets[id]["is_deleted"] = True
            self.secrets[id]["deleted_at"] = datetime.now(timezone.utc)
            return True
        return False

    def cleanup_expired(self) -> int:
        now = datetime.now(timezone.utc)
        expired = [
            id for id, s in self.secrets.items()
            if not s["is_deleted"] and now > s["expires_at"]
        ]
        for id in expired:
            self.delete(id)
        return len(expired)


storage = InMemoryStorage()
