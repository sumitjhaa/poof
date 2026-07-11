from fastapi import APIRouter, HTTPException, Request

from app.models import SecretRead, ErrorResponse
from app.storage import storage
from app.limiter import limiter
from app.auth import verify_password
from app.audit import audit_log, AuditEvent

router = APIRouter()


@router.get("/{id}", response_model=SecretRead, responses={404: {"model": ErrorResponse}, 410: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def read_secret(request: Request, id: str, password: str = None):
    secret = await storage.get(id)
    if not secret:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found or expired"})

    # Check if password is required but not provided
    if secret.get("password_hash") and not password:
        raise HTTPException(
            status_code=403,
            detail={"error": "password_required", "message": "Password is required to access this secret"}
        )

    # Verify password if provided
    if password:
        if not verify_password(password, secret["password_hash"], secret["password_salt"]):
            raise HTTPException(
                status_code=403,
                detail={"error": "invalid_password", "message": "Incorrect password"}
            )

    # Check views remaining
    views_remaining = secret["max_views"] - secret["views_count"]
    if views_remaining <= 0:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "Secret has been consumed"})

    # Log audit event (view count incremented via POST /viewed on tab close)
    audit_log.log(
        event=AuditEvent.SECRET_READ,
        resource_id=id,
        resource_type="secret",
        metadata={"views_remaining": views_remaining},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return SecretRead(
        id=id,
        encrypted_data=secret["encrypted_data"],
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        views_remaining=views_remaining,
        has_password=secret.get("password_hash") is not None,
    )


@router.post("/{id}/viewed", status_code=204)
@limiter.limit("10/minute")
async def mark_viewed(request: Request, id: str):
    secret = await storage.get(id)
    if not secret:
        return None
    await storage.increment_view(id)
    return None
