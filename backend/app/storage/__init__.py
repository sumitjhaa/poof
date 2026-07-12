from app.storage.memory import MemoryStorage
from app.storage.postgres import PostgresStorage


class Storage:
    def __init__(self):
        self._memory = MemoryStorage()
        self._postgres = PostgresStorage()
        self._use_db = False

    async def init(self):
        from app.database import init_db
        self._use_db = await init_db()

    async def create(self, id: str, encrypted_data: str, expires_in: int, max_views: int,
                     password_hash: str = None, password_salt: str = None) -> dict:
        if self._use_db:
            return await self._postgres.create(id, encrypted_data, expires_in, max_views, password_hash, password_salt)
        return self._memory.create(id, encrypted_data, expires_in, max_views, password_hash, password_salt)

    async def get(self, id: str) -> dict | None:
        if self._use_db:
            return await self._postgres.get(id)
        return self._memory.get(id)

    async def increment_view(self, id: str) -> dict | None:
        if self._use_db:
            return await self._postgres.increment_view(id)
        return self._memory.increment_view(id)

    async def delete(self, id: str) -> bool:
        if self._use_db:
            return await self._postgres.delete(id)
        return self._memory.delete(id)

    async def cleanup_expired(self) -> list[str]:
        if self._use_db:
            return await self._postgres.cleanup_expired()
        return self._memory.cleanup_expired()


storage = Storage()
