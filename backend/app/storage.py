from datetime import datetime, timezone
from sqlalchemy import select, update, delete

from app.database import get_session, Secret


class PostgresStorage:
    def __init__(self):
        self.use_db = False
        self.in_memory = {}

    async def init(self):
        from app.database import init_db
        self.use_db = await init_db()

    async def create(self, id: str, encrypted_data: str, expires_in: int, max_views: int) -> dict:
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc)

        if self.use_db:
            session = await get_session()
            async with session:
                secret = Secret(
                    id=id,
                    encrypted_data=encrypted_data,
                    created_at=now,
                    expires_at=expires_at,
                    max_views=max_views,
                )
                session.add(secret)
                await session.commit()
        else:
            self.in_memory[id] = {
                "id": id,
                "encrypted_data": encrypted_data,
                "created_at": now,
                "expires_at": expires_at,
                "max_views": max_views,
                "views_count": 0,
                "is_deleted": False,
            }
            return self.in_memory[id]

        return {
            "id": id,
            "encrypted_data": encrypted_data,
            "created_at": now,
            "expires_at": expires_at,
            "max_views": max_views,
            "views_count": 0,
            "is_deleted": False,
        }

    async def get(self, id: str) -> dict | None:
        if not self.use_db:
            secret = self.in_memory.get(id)
            if not secret or secret["is_deleted"]:
                return None
            if datetime.now(timezone.utc) > secret["expires_at"]:
                await self.delete(id)
                return None
            return secret

        session = await get_session()
        async with session:
            result = await session.execute(
                select(Secret).where(Secret.id == id, Secret.is_deleted == False)
            )
            secret = result.scalar_one_or_none()

            if not secret:
                return None

            if datetime.now(timezone.utc) > secret.expires_at:
                await self.delete(id)
                return None

            return {
                "id": secret.id,
                "encrypted_data": secret.encrypted_data,
                "created_at": secret.created_at,
                "expires_at": secret.expires_at,
                "max_views": secret.max_views,
                "views_count": secret.views_count,
                "is_deleted": secret.is_deleted,
            }

    async def increment_view(self, id: str) -> dict | None:
        if not self.use_db:
            secret = self.in_memory.get(id)
            if not secret or secret["is_deleted"]:
                return None
            secret["views_count"] += 1
            if secret["views_count"] >= secret["max_views"]:
                secret["is_deleted"] = True
                secret["deleted_at"] = datetime.now(timezone.utc)
            return secret

        session = await get_session()
        async with session:
            result = await session.execute(
                select(Secret).where(Secret.id == id, Secret.is_deleted == False)
            )
            secret = result.scalar_one_or_none()

            if not secret:
                return None

            secret.views_count += 1
            if secret.views_count >= secret.max_views:
                secret.is_deleted = True
                secret.deleted_at = datetime.now(timezone.utc)

            await session.commit()

            return {
                "id": secret.id,
                "encrypted_data": secret.encrypted_data,
                "created_at": secret.created_at,
                "expires_at": secret.expires_at,
                "max_views": secret.max_views,
                "views_count": secret.views_count,
                "is_deleted": secret.is_deleted,
            }

    async def delete(self, id: str) -> bool:
        if not self.use_db:
            if id in self.in_memory:
                self.in_memory[id]["is_deleted"] = True
                self.in_memory[id]["deleted_at"] = datetime.now(timezone.utc)
                return True
            return False

        session = await get_session()
        async with session:
            result = await session.execute(
                update(Secret)
                .where(Secret.id == id)
                .values(is_deleted=True, deleted_at=datetime.now(timezone.utc))
            )
            await session.commit()
            return result.rowcount > 0


storage = PostgresStorage()
