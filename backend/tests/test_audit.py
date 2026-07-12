import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.storage import storage
from app.audit import audit_log, AuditEvent
from app.geo import GeoResolver

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset():
    storage._memory.secrets.clear()
    audit_log._entries.clear()
    yield
    storage._memory.secrets.clear()
    audit_log._entries.clear()


# ── Audit logging on secret create ──

def test_secret_create_logs_audit():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })
    assert resp.status_code == 201
    entries = audit_log.query(event=AuditEvent.SECRET_CREATED)
    assert len(entries) == 1
    assert entries[0].resource_type == "secret"
    assert entries[0].ip_address is not None


# ── Audit logging on secret read ──

def test_secret_read_logs_audit():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 2,
    })
    secret_id = resp.json()["id"]

    client.get(f"/api/secrets/{secret_id}")

    entries = audit_log.query(event=AuditEvent.SECRET_READ)
    assert len(entries) == 1
    assert entries[0].resource_id == secret_id


# ── Audit logging on secret delete ──

def test_secret_delete_logs_audit():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })
    secret_id = resp.json()["id"]

    client.delete(f"/api/secrets/{secret_id}")

    entries = audit_log.query(event=AuditEvent.SECRET_DELETED)
    assert len(entries) == 1
    assert entries[0].resource_id == secret_id


# ── Audit logging on file upload/download ──

def test_file_upload_logs_audit():
    import io
    resp = client.post("/api/files/", files={
        "file": ("test.txt", io.BytesIO(b"hello"), "text/plain"),
    }, data={"expires_in": "3600", "max_views": "1"})
    assert resp.status_code == 200

    entries = audit_log.query(event=AuditEvent.FILE_UPLOADED)
    assert len(entries) == 1
    assert entries[0].resource_type == "file"
    assert entries[0].metadata["filename"] == "test.txt"


def test_file_download_logs_audit():
    import io
    resp = client.post("/api/files/", files={
        "file": ("test.txt", io.BytesIO(b"hello"), "text/plain"),
    }, data={"expires_in": "3600", "max_views": "2"})
    file_id = resp.json()["id"]

    client.get(f"/api/files/{file_id}")

    entries = audit_log.query(event=AuditEvent.FILE_DOWNLOADED)
    assert len(entries) == 1
    assert entries[0].resource_id == file_id


# ── Audit logging on API key create/revoke ──

def test_api_key_create_logs_audit():
    resp = client.post("/api/keys/", json={"name": "test-key", "rate_limit": 100})
    assert resp.status_code == 201

    entries = audit_log.query(event=AuditEvent.API_KEY_CREATED)
    assert len(entries) == 1
    assert entries[0].resource_type == "api_key"
    assert entries[0].metadata["name"] == "test-key"


def test_api_key_revoke_logs_audit():
    resp = client.post("/api/keys/", json={"name": "revoke-me", "rate_limit": 50})
    key_id = resp.json()["id"]

    client.delete(f"/api/keys/{key_id}")

    entries = audit_log.query(event=AuditEvent.API_KEY_REVOKED)
    assert len(entries) == 1
    assert entries[0].resource_id == key_id


# ── Audit cleanup expired ──

def test_cleanup_expired_logs_audit():
    storage._memory.create("exp1", "data", expires_in=-1, max_views=10)
    storage._memory.create("exp2", "data", expires_in=-1, max_views=10)
    storage._memory.create("valid", "data", expires_in=3600, max_views=10)

    import asyncio
    expired_ids = asyncio.run(storage.cleanup_expired())

    for secret_id in expired_ids:
        audit_log.log(
            event=AuditEvent.SECRET_EXPIRED,
            resource_id=secret_id,
            resource_type="secret",
        )

    assert set(expired_ids) == {"exp1", "exp2"}
    entries = audit_log.query(event=AuditEvent.SECRET_EXPIRED)
    assert len(entries) == 2
    expired_ids_logged = {e.resource_id for e in entries}
    assert "exp1" in expired_ids_logged
    assert "exp2" in expired_ids_logged


# ── Audit API endpoint ──

def test_audit_list_endpoint():
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })

    resp = client.get("/api/audit/")
    assert resp.status_code == 200
    data = resp.json()
    assert "entries" in data
    assert data["total"] >= 1
    entry = data["entries"][0]
    assert "location" in entry


def test_audit_stats_endpoint():
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })

    resp = client.get("/api/audit/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_events" in data
    assert "by_event" in data
    assert data["total_events"] >= 1


def test_audit_export_json():
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })

    resp = client.get("/api/audit/export?format=json")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "location" in data[0]


def test_audit_export_csv():
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })

    resp = client.get("/api/audit/export?format=csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


def test_audit_filter_by_event():
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })

    resp = client.get("/api/audit/?event=secret.created")
    assert resp.status_code == 200
    data = resp.json()
    assert all(e["event"] == "secret.created" for e in data["entries"])


# ── Geolocation resolver ──

def test_geo_resolver_caches():
    resolver = GeoResolver()
    resolver._cache["1.2.3.4"] = "New York, New York, United States"
    assert resolver.resolve_sync("1.2.3.4") == "New York, New York, United States"


def test_geo_resolver_localhost():
    resolver = GeoResolver()
    assert resolver.resolve_sync("127.0.0.1") is None
    assert resolver.resolve_sync("::1") is None
    assert resolver.resolve_sync("localhost") is None


def test_geo_resolver_empty_ip():
    resolver = GeoResolver()
    assert resolver.resolve_sync("") is None
    assert resolver.resolve_sync(None) is None


def test_geo_resolver_clear():
    resolver = GeoResolver()
    resolver._cache["1.2.3.4"] = "test"
    resolver.clear()
    assert "1.2.3.4" not in resolver._cache
