import pytest
from app.core.ratelimit import limiter


@pytest.fixture(autouse=True)
def disable_rate_limits_for_tests():
    original = limiter.enabled
    limiter.enabled = False
    yield
    limiter.enabled = original
