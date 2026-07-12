from uuid import uuid4
from fastapi import APIRouter, Request

from app.models import SecretCreate, SecretResponse
from app.storage import storage
from app.limiter import limiter
from app.webhooks import webhook_store, Webhook
from app.audit import audit_log, AuditEvent

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

    # Register webhook if provided
    if data.webhook_url:
        webhook = Webhook(
            id=str(uuid4()),
            url=data.webhook_url,
            secret_id=id,
            event="expired",
            created_at=secret["created_at"],
        )
        webhook_store.add(webhook)

    # Log audit event
    audit_log.log(
        event=AuditEvent.SECRET_CREATED,
        resource_id=id,
        resource_type="secret",
        metadata={"expires_in": data.expires_in, "max_views": data.max_views},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    base_url = str(request.base_url).rstrip("/")
    return SecretResponse(
        id=id,
        created_at=secret["created_at"],
        expires_at=secret["expires_at"],
        url=f"{base_url}/s/{id}",
        webhook_id=webhook.id if data.webhook_url else None,
    )
