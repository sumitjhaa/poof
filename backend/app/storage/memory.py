from datetime import datetime, timezone


class MemoryStorage:
    def __init__(self):
        self.secrets: dict[str, dict] = {}

    def create(self, id: str, encrypted_data: str, expires_in: int, max_views: int,
               password_hash: str = None, password_salt: str = None) -> dict:
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc)
        secret = {
            "id": id,
            "encrypted_data": encrypted_data,
            "created_at": now,
            "expires_at": expires_at,
            "max_views": max_views,
            "views_count": 0,
            "is_deleted": False,
            "password_hash": password_hash,
            "password_salt": password_salt,
        }
        self.secrets[id] = secret
        return secret

    def get(self, id: str) -> dict | None:
        secret = self.secrets.get(id)
        if not secret or secret["is_deleted"]:
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
            secret["is_deleted"] = True
            secret["deleted_at"] = datetime.now(timezone.utc)
        return secret

    def delete(self, id: str) -> bool:
        if id in self.secrets:
            self.secrets[id]["is_deleted"] = True
            self.secrets[id]["deleted_at"] = datetime.now(timezone.utc)
            return True
        return False

    def cleanup_expired(self) -> int:
        import asyncio
        from app.webhooks import notify_webhooks

        now = datetime.now(timezone.utc)
        expired = [
            id for id, s in self.secrets.items()
            if not s["is_deleted"] and now > s["expires_at"]
        ]
        for id in expired:
            self.delete(id)
            try:
                asyncio.create_task(notify_webhooks(id, "expired"))
            except RuntimeError:
                pass
        return len(expired)
