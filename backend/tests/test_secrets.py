import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import storage
from app.crypto import generate_key, encrypt

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_storage():
    storage._memory.secrets.clear()
    yield
    storage._memory.secrets.clear()


# ── Create ──

def test_create_secret():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
    })

    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["url"] == f"/s/{data['id']}"
    assert "created_at" in data
    assert "expires_at" in data


def test_create_secret_with_password():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
        "password_hash": "abc123",
        "password_salt": "def456",
    })

    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data

    secret = storage._memory.secrets[data["id"]]
    assert secret["password_hash"] == "abc123"
    assert secret["password_salt"] == "def456"


def test_create_secret_with_webhook():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
        "webhook_url": "https://example.com/hook",
    })

    assert resp.status_code == 201
    data = resp.json()
    assert data["webhook_id"] is not None


# ── Read ──

def test_read_secret_returns_encrypted_data():
    key = generate_key()
    encrypted = encrypt(key, "hello-world")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.status_code == 200
    data = read_resp.json()
    assert data["encrypted_data"] == encrypted
    assert data["views_remaining"] == 0


def test_read_secret_has_password_false():
    key = generate_key()
    encrypted = encrypt(key, "secret")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.json()["has_password"] is False


def test_read_secret_has_password_true():
    key = generate_key()
    encrypted = encrypt(key, "secret")

    from app.auth import hash_password
    h, s = hash_password("pass")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
        "password_hash": h,
        "password_salt": s,
    })
    secret_id = create_resp.json()["id"]

    read_resp = client.post(f"/api/secrets/{secret_id}/read", json={"password": "pass"})
    assert read_resp.status_code == 200
    assert read_resp.json()["has_password"] is True


# ── Views ──

def test_single_view_consumes_secret():
    key = generate_key()
    encrypted = encrypt(key, "one-time")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    resp1 = client.get(f"/api/secrets/{secret_id}")
    assert resp1.status_code == 200
    assert resp1.json()["views_remaining"] == 0

    resp2 = client.get(f"/api/secrets/{secret_id}")
    assert resp2.status_code == 404


def test_multi_view_consumes_after_max():
    key = generate_key()
    encrypted = encrypt(key, "multi-view")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 3,
    })
    secret_id = create_resp.json()["id"]

    resp1 = client.get(f"/api/secrets/{secret_id}")
    assert resp1.status_code == 200
    assert resp1.json()["views_remaining"] == 2

    resp2 = client.get(f"/api/secrets/{secret_id}")
    assert resp2.status_code == 200
    assert resp2.json()["views_remaining"] == 1

    resp3 = client.get(f"/api/secrets/{secret_id}")
    assert resp3.status_code == 200
    assert resp3.json()["views_remaining"] == 0

    resp4 = client.get(f"/api/secrets/{secret_id}")
    assert resp4.status_code == 404


def test_10_views():
    key = generate_key()
    encrypted = encrypt(key, "ten-views")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 10,
    })
    secret_id = create_resp.json()["id"]

    for i in range(10):
        resp = client.get(f"/api/secrets/{secret_id}")
        assert resp.status_code == 200
        assert resp.json()["views_remaining"] == 9 - i

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 404


# ── Password ──

def test_password_required_no_password():
    key = generate_key()
    encrypted = encrypt(key, "protected-secret")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
        "password_hash": "abc",
        "password_salt": "def",
    })
    secret_id = create_resp.json()["id"]

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 403
    assert resp.json()["detail"]["error"] == "password_required"


def test_password_wrong_password():
    key = generate_key()
    encrypted = encrypt(key, "protected-secret")

    from app.auth import hash_password
    hash_val, salt_val = hash_password("correct-password")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
        "password_hash": hash_val,
        "password_salt": salt_val,
    })
    secret_id = create_resp.json()["id"]

    resp = client.post(f"/api/secrets/{secret_id}/read", json={"password": "wrong-password"})
    assert resp.status_code == 403
    assert resp.json()["detail"]["error"] == "invalid_password"


def test_password_correct_password():
    key = generate_key()
    encrypted = encrypt(key, "protected-secret")

    from app.auth import hash_password
    hash_val, salt_val = hash_password("correct-password")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
        "password_hash": hash_val,
        "password_salt": salt_val,
    })
    secret_id = create_resp.json()["id"]

    resp = client.post(f"/api/secrets/{secret_id}/read", json={"password": "correct-password"})
    assert resp.status_code == 200
    assert resp.json()["encrypted_data"] == encrypted


def test_password_correct_then_consumed():
    key = generate_key()
    encrypted = encrypt(key, "protected-secret")

    from app.auth import hash_password
    hash_val, salt_val = hash_password("pass123")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
        "password_hash": hash_val,
        "password_salt": salt_val,
    })
    secret_id = create_resp.json()["id"]

    resp1 = client.post(f"/api/secrets/{secret_id}/read", json={"password": "pass123"})
    assert resp1.status_code == 200

    resp2 = client.post(f"/api/secrets/{secret_id}/read", json={"password": "pass123"})
    assert resp2.status_code == 404


def test_password_multi_view():
    key = generate_key()
    encrypted = encrypt(key, "protected-secret")

    from app.auth import hash_password
    hash_val, salt_val = hash_password("mypass")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 2,
        "password_hash": hash_val,
        "password_salt": salt_val,
    })
    secret_id = create_resp.json()["id"]

    resp1 = client.post(f"/api/secrets/{secret_id}/read", json={"password": "mypass"})
    assert resp1.status_code == 200
    assert resp1.json()["views_remaining"] == 1

    resp2 = client.post(f"/api/secrets/{secret_id}/read", json={"password": "mypass"})
    assert resp2.status_code == 200
    assert resp2.json()["views_remaining"] == 0

    resp3 = client.post(f"/api/secrets/{secret_id}/read", json={"password": "mypass"})
    assert resp3.status_code == 404


def test_password_not_asked_for_non_password_secret():
    key = generate_key()
    encrypted = encrypt(key, "no-password-here")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 200


def test_providing_password_for_non_password_secret_does_not_crash():
    key = generate_key()
    encrypted = encrypt(key, "no-password-here")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    resp = client.post(f"/api/secrets/{secret_id}/read", json={"password": "anything"})
    assert resp.status_code == 200


# ── Delete ──

def test_delete_secret():
    key = generate_key()
    encrypted = encrypt(key, "to-delete")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 5,
    })
    secret_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/secrets/{secret_id}")
    assert del_resp.status_code == 204

    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.status_code == 404


def test_delete_nonexistent():
    resp = client.delete("/api/secrets/nonexistent-id")
    assert resp.status_code == 404


def test_read_after_delete():
    key = generate_key()
    encrypted = encrypt(key, "delete-me")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 5,
    })
    secret_id = create_resp.json()["id"]

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 200

    client.delete(f"/api/secrets/{secret_id}")

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 404


# ── Edge cases ──

def test_read_nonexistent():
    resp = client.get("/api/secrets/nonexistent-id")
    assert resp.status_code == 404


def test_read_consumed_returns_404_not_410():
    key = generate_key()
    encrypted = encrypt(key, "consumed")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    client.get(f"/api/secrets/{secret_id}")

    resp = client.get(f"/api/secrets/{secret_id}")
    assert resp.status_code == 404


def test_create_with_minimal_values():
    key = generate_key()
    encrypted = encrypt(key, "x")

    resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 60,
        "max_views": 1,
    })
    assert resp.status_code == 201


def test_create_with_max_values():
    key = generate_key()
    encrypted = encrypt(key, "max-val")

    resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 2592000,
        "max_views": 10,
    })
    assert resp.status_code == 201
