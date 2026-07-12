import io
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import storage

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_storage():
    storage._memory.secrets.clear()
    yield
    storage._memory.secrets.clear()


def _upload(content: bytes = b"hello world", filename: str = "test.txt",
            content_type: str = "text/plain", expires_in: int = 3600,
            max_views: int = 1, password_hash: str = None, password_salt: str = None):
    data = {}
    files = {"file": (filename, io.BytesIO(content), content_type)}
    form = {
        "expires_in": str(expires_in),
        "max_views": str(max_views),
    }
    if password_hash:
        form["password_hash"] = password_hash
    if password_salt:
        form["password_salt"] = password_salt

    return client.post("/api/files/", files=files, data=form)


# ── Upload ──

def test_upload_file():
    resp = _upload(b"test data", "test.txt")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["filename"] == "test.txt"
    assert data["size"] == 9
    assert "created_at" in data
    assert "expires_at" in data


def test_upload_file_full_url():
    resp = _upload(b"data", "file.pdf")
    data = resp.json()
    url = data["url"]
    assert url.startswith("http://testserver/f/")
    assert data["id"] in url


def test_upload_file_stores_password():
    resp = _upload(b"data", "secret.bin", password_hash="abc123", password_salt="def456")
    assert resp.status_code == 200
    data = resp.json()
    secret = storage._memory.secrets[data["id"]]
    assert secret["password_hash"] == "abc123"
    assert secret["password_salt"] == "def456"


def test_upload_file_no_password():
    resp = _upload(b"data", "open.bin")
    data = resp.json()
    secret = storage._memory.secrets[data["id"]]
    assert secret["password_hash"] is None
    assert secret["password_salt"] is None


# ── Download ──

def test_download_file():
    content = b"download me"
    resp = _upload(content, "download.txt")
    file_id = resp.json()["id"]

    dl_resp = client.get(f"/api/files/{file_id}")
    assert dl_resp.status_code == 200
    assert dl_resp.content == content
    assert "download.txt" in dl_resp.headers.get("content-disposition", "")


def test_download_file_content_type():
    resp = _upload(b"<h1>hi</h1>", "page.html", content_type="text/html")
    file_id = resp.json()["id"]

    dl_resp = client.get(f"/api/files/{file_id}")
    assert dl_resp.headers["content-type"].startswith("text/html")


def test_download_nonexistent():
    resp = client.get("/api/files/nonexistent-id")
    assert resp.status_code == 404


# ── Views / consumption ──

def test_download_consumes_single_view():
    resp = _upload(b"once", "once.txt", max_views=1)
    file_id = resp.json()["id"]

    dl1 = client.get(f"/api/files/{file_id}")
    assert dl1.status_code == 200

    dl2 = client.get(f"/api/files/{file_id}")
    assert dl2.status_code == 404


def test_download_multi_view():
    content = b"multi"
    resp = _upload(content, "multi.txt", max_views=3)
    file_id = resp.json()["id"]

    dl1 = client.get(f"/api/files/{file_id}")
    assert dl1.status_code == 200
    assert dl1.content == content

    dl2 = client.get(f"/api/files/{file_id}")
    assert dl2.status_code == 200
    assert dl2.content == content

    dl3 = client.get(f"/api/files/{file_id}")
    assert dl3.status_code == 200
    assert dl3.content == content

    dl4 = client.get(f"/api/files/{file_id}")
    assert dl4.status_code == 404


def test_download_max_views_10():
    content = b"ten"
    resp = _upload(content, "ten.txt", max_views=10)
    file_id = resp.json()["id"]

    for _ in range(10):
        dl = client.get(f"/api/files/{file_id}")
        assert dl.status_code == 200
        assert dl.content == content

    dl = client.get(f"/api/files/{file_id}")
    assert dl.status_code == 404


# ── Password ──

def test_download_password_required():
    from app.auth import hash_password
    h, s = hash_password("secret123")

    resp = _upload(b"data", "protected.bin", password_hash=h, password_salt=s)
    file_id = resp.json()["id"]

    dl = client.get(f"/api/files/{file_id}")
    assert dl.status_code == 403
    assert dl.json()["detail"]["error"] == "password_required"


def test_download_wrong_password():
    from app.auth import hash_password
    h, s = hash_password("real-pass")

    resp = _upload(b"data", "protected.bin", password_hash=h, password_salt=s)
    file_id = resp.json()["id"]

    dl = client.get(f"/api/files/{file_id}?password=wrong")
    assert dl.status_code == 403
    assert dl.json()["detail"]["error"] == "invalid_password"


def test_download_correct_password():
    from app.auth import hash_password
    h, s = hash_password("real-pass")

    content = b"secret file"
    resp = _upload(content, "secret.bin", password_hash=h, password_salt=s)
    file_id = resp.json()["id"]

    dl = client.get(f"/api/files/{file_id}?password=real-pass")
    assert dl.status_code == 200
    assert dl.content == content


def test_download_password_consumed():
    from app.auth import hash_password
    h, s = hash_password("mypass")

    resp = _upload(b"data", "once.bin", max_views=1, password_hash=h, password_salt=s)
    file_id = resp.json()["id"]

    dl1 = client.get(f"/api/files/{file_id}?password=mypass")
    assert dl1.status_code == 200

    dl2 = client.get(f"/api/files/{file_id}?password=mypass")
    assert dl2.status_code == 404


def test_providing_password_for_non_password_file_does_not_crash():
    resp = _upload(b"data", "open.bin")
    file_id = resp.json()["id"]

    dl = client.get(f"/api/files/{file_id}?password=anything")
    assert dl.status_code == 200


# ── Delete ──

def test_delete_file():
    resp = _upload(b"data", "delete-me.bin")
    file_id = resp.json()["id"]

    del_resp = client.delete(f"/api/secrets/{file_id}")
    assert del_resp.status_code == 204

    dl = client.get(f"/api/files/{file_id}")
    assert dl.status_code == 404


def test_delete_nonexistent_file():
    resp = client.delete("/api/secrets/nonexistent")
    assert resp.status_code == 404


# ── File size limit ──

def test_upload_too_large():
    big_content = b"x" * (10 * 1024 * 1024 + 1)
    resp = _upload(big_content, "big.bin")
    assert resp.status_code == 413


def test_upload_at_size_limit():
    content = b"x" * (10 * 1024 * 1024)
    resp = _upload(content, "max.bin")
    assert resp.status_code == 200
