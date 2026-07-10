from uuid import uuid4
from fastapi import APIRouter, Request

from app.models import SecretCreate, SecretResponse
from app.storage import storage
from app.limiter import limiter

router = APIRouter()


@router.post("/", response_model=SecretResponse, status_code=201)
@limiter.limit("10/minute")
async def create_secret(request: Request, data: SecretCreate):
    id = str(uuid4())
    secret = await storage.create(
        id=id,
        encrypted_data=data.encrypted_data,
        expires_in=data.expires_in,
        max_views=data.max_views,
        password_hash=data.password_hash,
        password_salt=data.password_salt,
    )
    return SecretResponse(
        id=id,
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        url=f"/s/{id}",
    )
