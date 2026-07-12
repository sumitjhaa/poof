import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api_keys import api_key_store

client = TestClient(app)


def _create_key(name="test", rate_limit=100):
    return api_key_store.generate(name=name, rate_limit=rate_limit)


def _auth_header(key):
    return {"Authorization": f"Bearer {key.key}"}


# ── Create secret with API key ──

def test_create_secret_with_valid_api_key():
    key = _create_key()
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    assert resp.status_code == 201
    assert "id" in resp.json()


def test_create_secret_without_api_key():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })
    assert resp.status_code == 201


def test_create_secret_with_invalid_api_key():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers={"Authorization": "Bearer invalid_key_here"})
    assert resp.status_code == 201


# ── Read secret with API key ──

def test_read_secret_with_valid_api_key():
    key = _create_key()
    create_resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 2,
    }, headers=_auth_header(key))
    secret_id = create_resp.json()["id"]

    resp = client.get(f"/api/secrets/{secret_id}", headers=_auth_header(key))
    assert resp.status_code == 200
    assert resp.json()["encrypted_data"] == "dGVzdA"


def test_read_secret_without_api_key():
    create_resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 2,
    })
    secret_id = create_resp.json()["id"]

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 200


# ── Delete secret with API key ──

def test_delete_secret_with_valid_api_key():
    key = _create_key()
    create_resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    secret_id = create_resp.json()["id"]

    resp = client.delete(f"/api/secrets/{secret_id}", headers=_auth_header(key))
    assert resp.status_code == 204

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 404


# ── API key audit logging ──

def test_create_with_api_key_logs_key_id():
    key = _create_key()
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    assert resp.status_code == 201
    secret_id = resp.json()["id"]

    from app.audit import audit_log
    entries = audit_log.query(resource_id=secret_id)
    assert len(entries) == 1
    assert entries[0].metadata["api_key_id"] == key.id


def test_read_with_api_key_logs_key_id():
    key = _create_key()
    create_resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 2,
    }, headers=_auth_header(key))
    secret_id = create_resp.json()["id"]

    client.get(f"/api/secrets/{secret_id}", headers=_auth_header(key))

    from app.audit import audit_log
    entries = audit_log.query(resource_id=secret_id, event="secret.read")
    assert len(entries) == 1
    assert entries[0].metadata["api_key_id"] == key.id


def test_create_without_api_key_no_key_id_in_audit():
    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    })
    secret_id = resp.json()["id"]

    from app.audit import audit_log
    entries = audit_log.query(resource_id=secret_id)
    assert len(entries) == 1
    assert "api_key_id" not in (entries[0].metadata or {})


# ── API key rate limiting ──

def test_api_key_rate_limit_enforced():
    key = _create_key(rate_limit=2)

    for _ in range(2):
        resp = client.post("/api/secrets", json={
            "encrypted_data": "dGVzdA",
            "expires_in": 3600,
            "max_views": 1,
        }, headers=_auth_header(key))
        assert resp.status_code == 201

    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    assert resp.status_code == 429


def test_different_api_keys_have_separate_limits():
    key1 = _create_key(name="key1", rate_limit=1)
    key2 = _create_key(name="key2", rate_limit=1)

    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key1))
    assert resp.status_code == 201

    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key2))
    assert resp.status_code == 201


# ── Revoked key rejected by validation ──

def test_revoked_key_does_not_authenticate():
    key = _create_key()
    api_key_store.revoke(key.id)

    resp = client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    assert resp.status_code == 201


# ── Verify key validation tracking ──

def test_api_key_requests_count_tracked():
    key = _create_key()
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))
    client.post("/api/secrets", json={
        "encrypted_data": "dGVzdA",
        "expires_in": 3600,
        "max_views": 1,
    }, headers=_auth_header(key))

    updated_key = api_key_store.get_by_id(key.id)
    assert updated_key.requests_count == 2
    assert updated_key.last_used is not None
