import pytest
from app.storage import storage
from app.limiter import limiter
from app.api_keys import api_key_store, rate_limiter


@pytest.fixture(autouse=True)
def reset_state():
    storage._memory.secrets.clear()
    api_key_store._keys.clear()
    rate_limiter._requests.clear()
    limiter.reset()
    yield
    storage._memory.secrets.clear()
    api_key_store._keys.clear()
    rate_limiter._requests.clear()
    limiter.reset()
