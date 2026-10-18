from fastapi import APIRouter
from app.models import HealthResponse

from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint."""
    return {"status": "ok", "sarvam_enabled": bool(settings.SARVAM_ENABLED)}
