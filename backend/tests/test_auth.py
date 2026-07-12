from app.auth import hash_password, verify_password, derive_key_from_password


def test_hash_password_returns_hex():
    hash_val, salt_val = hash_password("mypassword")
    assert isinstance(hash_val, str)
    assert isinstance(salt_val, str)
    assert len(hash_val) == 64  # SHA-256 = 32 bytes = 64 hex chars
    assert len(salt_val) == 32  # 16 bytes = 32 hex chars


def test_hash_password_different_each_time():
    h1, s1 = hash_password("same-password")
    h2, s2 = hash_password("same-password")
    assert h1 != h2
    assert s1 != s2


def test_verify_correct_password():
    hash_val, salt_val = hash_password("correct")
    assert verify_password("correct", hash_val, salt_val) is True


def test_verify_wrong_password():
    hash_val, salt_val = hash_password("correct")
    assert verify_password("wrong", hash_val, salt_val) is False


def test_verify_empty_password():
    hash_val, salt_val = hash_password("")
    assert verify_password("", hash_val, salt_val) is True
    assert verify_password("notempty", hash_val, salt_val) is False


def test_verify_long_password():
    long_pass = "a" * 10000
    hash_val, salt_val = hash_password(long_pass)
    assert verify_password(long_pass, hash_val, salt_val) is True
    assert verify_password("a" * 9999, hash_val, salt_val) is False


def test_derive_key_deterministic():
    salt = b"\x00" * 16
    k1 = derive_key_from_password("test", salt)
    k2 = derive_key_from_password("test", salt)
    assert k1 == k2


def test_derive_key_different_salts():
    k1, _ = derive_key_from_password("test")
    k2, _ = derive_key_from_password("test")
    assert k1 != k2


def test_derive_key_length():
    key, salt = derive_key_from_password("test")
    assert len(key) == 32
    assert len(salt) == 16
