from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.ratelimit import limiter
from app.routes import health, extract, ask

app = FastAPI(
    title="Clausy Backend API",
    description="Stateless rental agreement analysis API powered by Gemma 4 with code-verified citations.",
    version="1.0.0",
)

# Attach slowapi limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware using ALLOWED_ORIGINS only (no wildcard in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handlers returning friendly JSON errors (never stack traces)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Invalid request parameters or field length exceeded."},
    )


import logging

logger = logging.getLogger("clausy")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    internal_reason = getattr(exc, "internal_reason", None)
    if internal_reason:
        logger.warning("Upstream Quota Warning: %s", internal_reason)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Never expose stack traces or internal secrets to user
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred while processing your request. Please try again."
        },
    )


# Register routes
app.include_router(health.router)
app.include_router(extract.router)
app.include_router(ask.router)
