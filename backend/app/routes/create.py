from uuid import uuid4
from fastapi import APIRouter, Depends, Request

from app.models import SecretCreate, SecretResponse
from app.storage import storage
from app.limiter import limiter
from app.webhooks import webhook_store, Webhook
from app.audit import audit_log, AuditEvent
from app.api_keys import APIKey, verify_api_key, require_rate_limit

router = APIRouter()


@router.post("/", response_model=SecretResponse, status_code=201)
@limiter.limit("10/minute")
async def create_secret(request: Request, data: SecretCreate, api_key: APIKey | None = Depends(verify_api_key)):
    require_rate_limit(request, api_key)

    id = str(uuid4())
    secret = await storage.create(
        id=id,
        encrypted_data=data.encrypted_data,
        expires_in=data.expires_in,
        max_views=data.max_views,
        password_hash=data.password_hash,
        password_salt=data.password_salt,
    )

    if data.webhook_url:
        webhook = Webhook(
            id=str(uuid4()),
            url=data.webhook_url,
            secret_id=id,
            event="expired",
            created_at=secret["created_at"],
        )
        webhook_store.add(webhook)

    metadata = {"expires_in": data.expires_in, "max_views": data.max_views}
    if api_key:
        metadata["api_key_id"] = api_key.id

    audit_log.log(
        event=AuditEvent.SECRET_CREATED,
        resource_id=id,
        resource_type="secret",
        metadata=metadata,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return SecretResponse(
        id=id,
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        url=f"/s/{id}",
        webhook_id=webhook.id if data.webhook_url else None,
    )
