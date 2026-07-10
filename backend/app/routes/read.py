from fastapi import APIRouter, HTTPException, Request

from app.models import SecretRead, ErrorResponse
from app.storage import storage
from app.limiter import limiter
from app.auth import verify_password

router = APIRouter()


@router.get("/{id}", response_model=SecretRead, responses={404: {"model": ErrorResponse}, 410: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def read_secret(request: Request, id: str, password: str = None):
    secret = await storage.get(id)
    if not secret:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found or expired"})

    if secret.get("password_hash"):
        if not password:
            raise HTTPException(
                status_code=403,
                detail={"error": "password_required", "message": "Password is required to access this secret"}
            )
        if not verify_password(password, secret["password_hash"], secret["password_salt"]):
            raise HTTPException(
                status_code=403,
                detail={"error": "invalid_password", "message": "Incorrect password"}
            )

    views_remaining = secret["max_views"] - secret["views_count"]
    if views_remaining <= 0:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "Secret has been consumed"})

    await storage.increment_view(id)

    return SecretRead(
        id=id,
        encrypted_data=secret["encrypted_data"],
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        views_remaining=views_remaining - 1,
        has_password=secret.get("password_hash") is not None,
    )
