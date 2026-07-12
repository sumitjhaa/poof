from fastapi import APIRouter, Depends, HTTPException, Request

from app.models import SecretRead, ErrorResponse
from app.storage import storage
from app.limiter import limiter
from app.auth import verify_password
from app.audit import audit_log, AuditEvent
from app.api_keys import APIKey, verify_api_key, require_rate_limit

router = APIRouter()


@router.get("/{id}", response_model=SecretRead, responses={404: {"model": ErrorResponse}, 410: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def read_secret(request: Request, id: str, password: str = None, api_key: APIKey | None = Depends(verify_api_key)):
    require_rate_limit(request, api_key)

    secret = await storage.get(id)
    if not secret:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found or expired"})

    if secret.get("password_hash") and not password:
        raise HTTPException(
            status_code=403,
            detail={"error": "password_required", "message": "Password is required to access this secret"}
        )

    if password and secret.get("password_hash"):
        if not verify_password(password, secret["password_hash"], secret["password_salt"]):
            raise HTTPException(
                status_code=403,
                detail={"error": "invalid_password", "message": "Incorrect password"}
            )

    views_remaining = secret["max_views"] - secret["views_count"]
    if views_remaining <= 0:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "Secret has been consumed"})

    updated = await storage.increment_view(id)
    if not updated:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "Secret has been consumed"})

    metadata = {"views_remaining": (updated["max_views"] - updated["views_count"]) if updated else 0}
    if api_key:
        metadata["api_key_id"] = api_key.id

    audit_log.log(
        event=AuditEvent.SECRET_READ,
        resource_id=id,
        resource_type="secret",
        metadata=metadata,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return SecretRead(
        id=id,
        encrypted_data=secret["encrypted_data"],
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        views_remaining=(updated["max_views"] - updated["views_count"]) if updated else 0,
        has_password=secret.get("password_hash") is not None,
    )
