import json
import uuid
import os
from pydantic import BaseModel
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import Response

from app.models import ErrorResponse
from app.storage import storage
from app.limiter import limiter
from app.audit import audit_log, AuditEvent
from app.api_keys import APIKey, verify_api_key, require_rate_limit


class FilePasswordRequest(BaseModel):
    password: str

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _server_encrypt_file(data: bytes, filename: str, content_type: str) -> str:
    key = os.urandom(32)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)

    payload = json.dumps({"filename": filename, "content_type": content_type}).encode() + b"\n" + data
    ciphertext = aesgcm.encrypt(nonce, payload, None)
    combined = nonce + ciphertext + key
    return combined.hex()


def _server_decrypt_file(encrypted_hex: str) -> tuple[bytes, str, str]:
    combined = bytes.fromhex(encrypted_hex)
    nonce = combined[:12]
    key = combined[-32:]
    ciphertext = combined[12:-32]
    aesgcm = AESGCM(key)
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    meta_end = decrypted.index(b"\n")
    metadata = json.loads(decrypted[:meta_end])
    file_data = decrypted[meta_end + 1:]
    return file_data, metadata["filename"], metadata["content_type"]


@router.post("/", responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}})
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    expires_in: int = Form(3600),
    max_views: int = Form(1),
    password_hash: str = Form(None),
    password_salt: str = Form(None),
    api_key: APIKey | None = Depends(verify_api_key),
):
    require_rate_limit(request, api_key)

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

    encrypted_data = _server_encrypt_file(content, file.filename, file.content_type or "application/octet-stream")

    secret_id = str(uuid.uuid4())
    secret = await storage.create(
        id=secret_id,
        encrypted_data=encrypted_data,
        expires_in=expires_in,
        max_views=max_views,
        password_hash=password_hash,
        password_salt=password_salt,
    )

    metadata = {"filename": file.filename, "size": len(content)}
    if api_key:
        metadata["api_key_id"] = api_key.id

    audit_log.log(
        event=AuditEvent.FILE_UPLOADED,
        resource_id=secret_id,
        resource_type="file",
        metadata=metadata,
        ip_address=request.client.host if request.client else None,
    )

    return {
        "id": secret["id"],
        "filename": file.filename,
        "size": len(content),
        "created_at": secret["created_at"],
        "expires_at": secret["expires_at"],
        "url": f"/f/{secret['id']}",
    }


async def _do_download_file(id: str, password: str | None, request: Request, api_key: APIKey | None) -> Response:
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

    updated = await storage.increment_view(id)
    if not updated:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "File has been consumed"})

    file_data, filename, content_type = _server_decrypt_file(secret["encrypted_data"])

    metadata = {"filename": filename}
    if api_key:
        metadata["api_key_id"] = api_key.id

    audit_log.log(
        event=AuditEvent.FILE_DOWNLOADED,
        resource_id=id,
        resource_type="file",
        metadata=metadata,
        ip_address=request.client.host if request.client else None,
    )

    return Response(
        content=file_data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/{id}", responses={404: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def download_file(
    request: Request,
    id: str,
    api_key: APIKey | None = Depends(verify_api_key),
):
    require_rate_limit(request, api_key)
    return await _do_download_file(id, None, request, api_key)


@router.post("/{id}/download", responses={404: {"model": ErrorResponse}})
@limiter.limit("30/minute")
async def download_file_with_password(
    request: Request,
    id: str,
    body: FilePasswordRequest,
    api_key: APIKey | None = Depends(verify_api_key),
):
    require_rate_limit(request, api_key)
    return await _do_download_file(id, body.password, request, api_key)
