from fastapi import APIRouter, Depends, HTTPException, Request

from app.storage import storage
from app.limiter import limiter
from app.audit import audit_log, AuditEvent
from app.api_keys import APIKey, verify_api_key, require_rate_limit

router = APIRouter()


@router.delete("/{id}", status_code=204)
@limiter.limit("10/minute")
async def delete_secret(request: Request, id: str, api_key: APIKey | None = Depends(verify_api_key)):
    require_rate_limit(request, api_key)

    if not await storage.delete(id):
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found"})

    metadata = {}
    if api_key:
        metadata["api_key_id"] = api_key.id

    audit_log.log(
        event=AuditEvent.SECRET_DELETED,
        resource_id=id,
        resource_type="secret",
        metadata=metadata or None,
        ip_address=request.client.host if request.client else None,
    )

    return None
