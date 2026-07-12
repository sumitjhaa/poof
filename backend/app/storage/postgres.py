from datetime import datetime, timezone
from sqlalchemy import select, update

from app.database import get_session, Secret


class PostgresStorage:
    async def create(self, id: str, encrypted_data: str, expires_in: int, max_views: int,
                     password_hash: str = None, password_salt: str = None) -> dict:
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc)

        session = await get_session()
        async with session:
            secret = Secret(
                id=id,
                encrypted_data=encrypted_data,
                created_at=now,
                expires_at=expires_at,
                max_views=max_views,
                password_hash=password_hash,
                password_salt=password_salt,
            )
            session.add(secret)
            await session.commit()

        return {
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

    async def get(self, id: str) -> dict | None:
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
                "password_hash": secret.password_hash,
                "password_salt": secret.password_salt,
            }

    async def increment_view(self, id: str) -> dict | None:
        session = await get_session()
        async with session:
            result = await session.execute(
                select(Secret).where(Secret.id == id, Secret.is_deleted == False)
            )
            secret = result.scalar_one_or_none()

            if not secret:
                return None

            new_count = secret.views_count + 1
            should_delete = new_count >= secret.max_views

            await session.execute(
                update(Secret)
                .where(Secret.id == id, Secret.is_deleted == False)
                .values(
                    views_count=new_count,
                    is_deleted=should_delete,
                    deleted_at=datetime.now(timezone.utc) if should_delete else None,
                )
            )
            await session.commit()

            return {
                "id": secret.id,
                "encrypted_data": secret.encrypted_data,
                "created_at": secret.created_at,
                "expires_at": secret.expires_at,
                "max_views": secret.max_views,
                "views_count": new_count,
                "is_deleted": should_delete,
            }

    async def delete(self, id: str) -> bool:
        session = await get_session()
        async with session:
            result = await session.execute(
                update(Secret)
                .where(Secret.id == id)
                .values(is_deleted=True, deleted_at=datetime.now(timezone.utc))
            )
            await session.commit()
            return result.rowcount > 0

    async def cleanup_expired(self) -> list[str]:
        session = await get_session()
        async with session:
            now = datetime.now(timezone.utc)
            result = await session.execute(
                select(Secret).where(Secret.is_deleted == False, Secret.expires_at < now)
            )
            expired = result.scalars().all()
            ids = [s.id for s in expired]
            for secret in expired:
                await self.delete(secret.id)
            return ids
