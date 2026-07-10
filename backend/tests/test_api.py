import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import storage
from app.crypto import generate_key, encrypt

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_storage():
    storage.in_memory.clear()
    yield
    storage.in_memory.clear()


def test_create_secret():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    response = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
    })

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "url" in data
    assert "created_at" in data
    assert "expires_at" in data


def test_read_secret():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    # Create
    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "expires_in": 3600,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    # Read
    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.status_code == 200
    data = read_resp.json()
    assert data["encrypted_data"] == encrypted
    assert data["views_remaining"] == 0  # Consumed after read


def test_read_consumes_secret():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 1,
    })
    secret_id = create_resp.json()["id"]

    # First read - success
    client.get(f"/api/secrets/{secret_id}")

    # Second read - gone
    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.status_code == 404


def test_max_views():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
        "max_views": 2,
    })
    secret_id = create_resp.json()["id"]

    # First read
    resp1 = client.get(f"/api/secrets/{secret_id}")
    assert resp1.status_code == 200
    assert resp1.json()["views_remaining"] == 1

    # Second read - consumed
    resp2 = client.get(f"/api/secrets/{secret_id}")
    assert resp2.status_code == 200
    assert resp2.json()["views_remaining"] == 0

    # Third read - gone
    resp3 = client.get(f"/api/secrets/{secret_id}")
    assert resp3.status_code == 404


def test_delete_secret():
    key = generate_key()
    encrypted = encrypt(key, "my-secret")

    create_resp = client.post("/api/secrets", json={
        "encrypted_data": encrypted,
    })
    secret_id = create_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/secrets/{secret_id}")
    assert del_resp.status_code == 204

    # Read after delete - gone
    read_resp = client.get(f"/api/secrets/{secret_id}")
    assert read_resp.status_code == 404


def test_read_nonexistent():
    response = client.get("/api/secrets/nonexistent-id")
    assert response.status_code == 404
