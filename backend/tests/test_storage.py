import pytest
from datetime import datetime, timezone, timedelta

from app.storage.memory import MemoryStorage


@pytest.fixture
def store():
    return MemoryStorage()


# ── Create & Get ──

def test_create_and_get(store):
    secret = store.create("id1", "data1", expires_in=3600, max_views=1)
    assert secret["id"] == "id1"
    assert secret["encrypted_data"] == "data1"
    assert secret["max_views"] == 1
    assert secret["views_count"] == 0
    assert secret["is_deleted"] is False

    got = store.get("id1")
    assert got is not None
    assert got["id"] == "id1"


def test_get_nonexistent(store):
    assert store.get("nope") is None


def test_create_with_password(store):
    secret = store.create("id1", "data", expires_in=3600, max_views=1,
                          password_hash="abc", password_salt="def")
    got = store.get("id1")
    assert got["password_hash"] == "abc"


def test_create_with_no_password(store):
    secret = store.create("id1", "data", expires_in=3600, max_views=1)
    got = store.get("id1")
    assert got["password_hash"] is None
    assert got["password_salt"] is None


# ── Expiry ──

def test_expired_secret_not_accessible(store):
    store.create("id1", "data", expires_in=-1, max_views=10)
    assert store.get("id1") is None


def test_not_yet_expired(store):
    secret = store.create("id1", "data", expires_in=3600, max_views=10)
    assert store.get("id1") is not None


def test_get_deletes_expired(store):
    store.create("id1", "data", expires_in=-1, max_views=10)
    store.get("id1")
    assert "id1" not in store.secrets or store.secrets["id1"]["is_deleted"]


# ── Views ──

def test_increment_view(store):
    store.create("id1", "data", expires_in=3600, max_views=3)
    result = store.increment_view("id1")
    assert result["views_count"] == 1
    assert result["is_deleted"] is False


def test_increment_to_max_deletes(store):
    store.create("id1", "data", expires_in=3600, max_views=2)
    store.increment_view("id1")
    result = store.increment_view("id1")
    assert result["views_count"] == 2
    assert result["is_deleted"] is True


def test_increment_after_deleted_returns_none(store):
    store.create("id1", "data", expires_in=3600, max_views=1)
    store.increment_view("id1")
    assert store.increment_view("id1") is None


def test_increment_nonexistent(store):
    assert store.increment_view("nope") is None


def test_views_count_progression(store):
    store.create("id1", "data", expires_in=3600, max_views=5)
    for i in range(5):
        result = store.increment_view("id1")
        assert result["views_count"] == i + 1
        if i < 4:
            assert result["is_deleted"] is False
        else:
            assert result["is_deleted"] is True


# ── Delete ──

def test_delete(store):
    store.create("id1", "data", expires_in=3600, max_views=1)
    assert store.delete("id1") is True
    assert store.get("id1") is None


def test_delete_nonexistent(store):
    assert store.delete("nope") is False


def test_delete_already_deleted(store):
    store.create("id1", "data", expires_in=3600, max_views=1)
    store.delete("id1")
    result = store.delete("id1")
    assert result is True
    assert store.get("id1") is None


def test_delete_sets_deleted_at(store):
    store.create("id1", "data", expires_in=3600, max_views=1)
    store.delete("id1")
    assert store.secrets["id1"]["deleted_at"] is not None


# ── Cleanup ──

def test_cleanup_expired(store):
    store.create("expired", "data", expires_in=-1, max_views=10)
    store.create("valid", "data", expires_in=3600, max_views=10)

    expired_ids = store.cleanup_expired()
    assert expired_ids == ["expired"]
    assert store.get("expired") is None
    assert store.get("valid") is not None


def test_cleanup_no_expired(store):
    store.create("id1", "data", expires_in=3600, max_views=10)
    expired_ids = store.cleanup_expired()
    assert expired_ids == []


def test_cleanup_ignores_deleted(store):
    store.create("id1", "data", expires_in=-1, max_views=10)
    store.delete("id1")
    expired_ids = store.cleanup_expired()
    assert expired_ids == []
