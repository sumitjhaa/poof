from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.models import SecretCreate, SecretResponse, SecretRead, ErrorResponse
from app.storage import storage

router = APIRouter(prefix="/api/secrets", tags=["secrets"])


@router.post("", response_model=SecretResponse, status_code=201)
async def create_secret(data: SecretCreate):
    id = str(uuid4())
    secret = storage.create(
        id=id,
        encrypted_data=data.encrypted_data,
        expires_in=data.expires_in,
        max_views=data.max_views,
    )
    return SecretResponse(
        id=id,
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        url=f"/s/{id}",
    )


@router.get("/{id}", response_model=SecretRead, responses={404: {"model": ErrorResponse}, 410: {"model": ErrorResponse}})
async def read_secret(id: str):
    secret = storage.get(id)
    if not secret:
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found or expired"})

    # Check if this read will consume it
    views_remaining = secret["max_views"] - secret["views_count"]
    if views_remaining <= 0:
        raise HTTPException(status_code=410, detail={"error": "consumed", "message": "Secret has been consumed"})

    # Increment view count
    storage.increment_view(id)

    return SecretRead(
        id=id,
        encrypted_data=secret["encrypted_data"],
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        views_remaining=views_remaining - 1,
    )


@router.delete("/{id}", status_code=204)
async def delete_secret(id: str):
    if not storage.delete(id):
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found"})
    return None
