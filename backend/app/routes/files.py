import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import Response

from app.models import ErrorResponse
from app.storage import storage
from app.limiter import limiter
from app.audit import audit_log, AuditEvent

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/", responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}})
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    expires_in: int = Form(3600),
    max_views: int = Form(1),
    password_hash: str = Form(None),
    password_salt: str = Form(None),
):
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail={"error": "file_too_large", "message": f"File exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"}
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_filename", "message": "Filename is required"}
        )

    import json
    file_data = json.dumps({
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "data": content.hex(),
    })

    secret_id = str(uuid.uuid4())
    secret = await storage.create(
        id=secret_id,
        encrypted_data=file_data,
        expires_in=expires_in,
        max_views=max_views,
        password_hash=password_hash,
        password_salt=password_salt,
    )

    audit_log.log(
        event=AuditEvent.FILE_UPLOADED,
        resource_id=secret_id,
        resource_type="file",
        metadata={"filename": file.filename, "size": len(content)},
        ip_address=request.client.host if request.client else None,
    )

    base_url = str(request.base_url).rstrip("/")
    return {
        "id": secret["id"],
        "filename": file.filename,
        "size": len(content),
        "created_at": secret["created_at"],
        "expires_at": secret["expires_at"],
        "url": f"{base_url}/f/{secret['id']}",
    }


@router.get("/{id}", responses={404: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def download_file(
    request: Request,
    id: str,
    password: str = None,
):
    secret = await storage.get(id)
    if not secret:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "File not found or expired"})

    if secret.get("password_hash") and not password:
        raise HTTPException(
            status_code=403,
            detail={"error": "password_required", "message": "Password is required"}
        )

    if password and secret.get("password_hash"):
        from app.auth import verify_password
        if not verify_password(password, secret["password_hash"], secret["password_salt"]):
            raise HTTPException(status_code=403, detail={"error": "invalid_password", "message": "Incorrect password"})

    views_remaining = secret["max_views"] - secret["views_count"]
    if views_remaining <= 0:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "File has been consumed"})

    await storage.increment_view(id)

    import json
    file_data = json.loads(secret["encrypted_data"])

    audit_log.log(
        event=AuditEvent.FILE_DOWNLOADED,
        resource_id=id,
        resource_type="file",
        metadata={"filename": file_data["filename"]},
        ip_address=request.client.host if request.client else None,
    )

    return Response(
        content=bytes.fromhex(file_data["data"]),
        media_type=file_data["content_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{file_data["filename"]}"',
        },
    )
