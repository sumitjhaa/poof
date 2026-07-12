from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.api_keys import api_key_store
from app.models import ErrorResponse
from app.audit import audit_log, AuditEvent

router = APIRouter()


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    rate_limit: int = Field(default=100, ge=10, le=1000)


class APIKeyResponse(BaseModel):
    id: str
    key: str
    name: str
    created_at: str
    rate_limit: int
    is_active: bool


class APIKeyListResponse(BaseModel):
    keys: list[APIKeyResponse]


@router.post("/", response_model=APIKeyResponse, status_code=201)
async def create_api_key(request: Request, data: APIKeyCreate):
    api_key = api_key_store.generate(name=data.name, rate_limit=data.rate_limit)

    audit_log.log(
        event=AuditEvent.API_KEY_CREATED,
        resource_id=api_key.id,
        resource_type="api_key",
        metadata={"name": data.name, "rate_limit": data.rate_limit},
        ip_address=request.client.host if request.client else None,
    )

    return APIKeyResponse(
        id=api_key.id,
        key=api_key.key,
        name=api_key.name,
        created_at=api_key.created_at.isoformat(),
        rate_limit=api_key.rate_limit,
        is_active=api_key.is_active,
    )


@router.get("/", response_model=APIKeyListResponse)
async def list_api_keys():
    keys = api_key_store.list_keys()

    return APIKeyListResponse(
        keys=[
            APIKeyResponse(
                id=k.id,
                key=k.key[:8] + "...",
                name=k.name,
                created_at=k.created_at.isoformat(),
                rate_limit=k.rate_limit,
                is_active=k.is_active,
            )
            for k in keys
        ]
    )


@router.delete("/{key_id}", responses={404: {"model": ErrorResponse}})
async def revoke_api_key(request: Request, key_id: str):
    if not api_key_store.revoke(key_id):
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "API key not found"})

    audit_log.log(
        event=AuditEvent.API_KEY_REVOKED,
        resource_id=key_id,
        resource_type="api_key",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "revoked"}
