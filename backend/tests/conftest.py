import pytest
from app.storage import storage
from app.limiter import limiter


@pytest.fixture(autouse=True)
def reset_state():
    storage._memory.secrets.clear()
    limiter.reset()
    yield
    storage._memory.secrets.clear()
    limiter.reset()
