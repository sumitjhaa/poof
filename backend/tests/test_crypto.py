from app.crypto import generate_key, encrypt, decrypt, encode_key, decode_key


def test_generate_key():
    key = generate_key()
    assert len(key) == 32


def test_encrypt_decrypt():
    key = generate_key()
    plaintext = "my-secret-password-123"

    encrypted = encrypt(key, plaintext)
    decrypted = decrypt(key, encrypted)

    assert decrypted == plaintext
    assert encrypted != plaintext


def test_encrypt_different_each_time():
    key = generate_key()
    plaintext = "same-secret"

    encrypted1 = encrypt(key, plaintext)
    encrypted2 = encrypt(key, plaintext)

    assert encrypted1 != encrypted2


def test_encode_decode_key():
    key = generate_key()

    encoded = encode_key(key)
    decoded = decode_key(encoded)

    assert decoded == key
    assert isinstance(encoded, str)


def test_wrong_key_fails():
    key1 = generate_key()
    key2 = generate_key()

    encrypted = encrypt(key1, "secret")

    try:
        decrypt(key2, encrypted)
        assert False, "Should have raised exception"
    except Exception:
        pass
