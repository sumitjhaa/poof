from fastapi import APIRouter, HTTPException, Request

from app.storage import storage
from app.audit import audit_log, AuditEvent

router = APIRouter()


@router.delete("/{id}", status_code=204)
async def delete_secret(request: Request, id: str):
    if not await storage.delete(id):
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found"})

    audit_log.log(
        event=AuditEvent.SECRET_DELETED,
        resource_id=id,
        resource_type="secret",
        ip_address=request.client.host if request.client else None,
    )

    return None
