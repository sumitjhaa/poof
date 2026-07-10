from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum


class AuditEvent(str, Enum):
    SECRET_CREATED = "secret.created"
    SECRET_READ = "secret.read"
    SECRET_DELETED = "secret.deleted"
    SECRET_EXPIRED = "secret.expired"
    FILE_UPLOADED = "file.uploaded"
    FILE_DOWNLOADED = "file.downloaded"
    API_KEY_CREATED = "apikey.created"
    API_KEY_REVOKED = "apikey.revoked"


@dataclass
class AuditEntry:
    id: str
    event: AuditEvent
    resource_id: str
    resource_type: str
    timestamp: datetime
    metadata: dict | None = None
    ip_address: str | None = None
    user_agent: str | None = None


class AuditLog:
    def __init__(self):
        self._entries: list[AuditEntry] = []
        self._max_entries = 10000

    def log(
        self,
        event: AuditEvent,
        resource_id: str,
        resource_type: str,
        metadata: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditEntry:
        import uuid

        entry = AuditEntry(
            id=str(uuid.uuid4()),
            event=event,
            resource_id=resource_id,
            resource_type=resource_type,
            timestamp=datetime.now(timezone.utc),
            metadata=metadata,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        self._entries.append(entry)

        # Trim if too many entries
        if len(self._entries) > self._max_entries:
            self._entries = self._entries[-self._max_entries:]

        return entry

    def query(
        self,
        resource_id: str | None = None,
        event: AuditEvent | None = None,
        resource_type: str | None = None,
        limit: int = 100,
    ) -> list[AuditEntry]:
        results = self._entries

        if resource_id:
            results = [e for e in results if e.resource_id == resource_id]

        if event:
            results = [e for e in results if e.event == event]

        if resource_type:
            results = [e for e in results if e.resource_type == resource_type]

        return sorted(results, key=lambda x: x.timestamp, reverse=True)[:limit]

    def export_json(self, limit: int = 1000) -> list[dict]:
        entries = self.query(limit=limit)
        return [
            {
                "id": e.id,
                "event": e.event.value,
                "resource_id": e.resource_id,
                "resource_type": e.resource_type,
                "timestamp": e.timestamp.isoformat(),
                "metadata": e.metadata,
                "ip_address": e.ip_address,
                "user_agent": e.user_agent,
            }
            for e in entries
        ]


audit_log = AuditLog()
