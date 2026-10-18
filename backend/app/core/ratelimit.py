from slowapi import Limiter
from starlette.requests import Request


def get_real_ipaddr(request: Request) -> str:
    """
    Returns the real client IP address. When behind a reverse proxy (Render, Vercel, etc.),
    keys on the first address in X-Forwarded-For. Otherwise falls back to request.client.host.
    """
    forwarded = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


# Per-IP rate limiter keying on client IP / X-Forwarded-For
limiter = Limiter(key_func=get_real_ipaddr)
