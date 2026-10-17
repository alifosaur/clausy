from slowapi import Limiter
from slowapi.util import get_remote_address

# Per-IP rate limiter
limiter = Limiter(key_func=get_remote_address)
