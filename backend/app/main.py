from contextlib import asynccontextmanager
from asyncio import Task

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routes import router as secrets_router
from app.routes import files as files_router
from app.routes import api_keys as api_keys_router
from app.routes import audit as audit_router
from app.storage import storage
from app.limiter import limiter
from app.security import SecurityHeadersMiddleware

cleanup_task: Task | None = None
keepalive_task: Task | None = None


async def cleanup_loop():
    import asyncio
    from app.audit import audit_log, AuditEvent

    while True:
        await asyncio.sleep(60)
        expired_ids = await storage.cleanup_expired()
        for secret_id in expired_ids:
            audit_log.log(
                event=AuditEvent.SECRET_EXPIRED,
                resource_id=secret_id,
                resource_type="secret",
            )
        if expired_ids:
            print(f"Cleaned up {len(expired_ids)} expired secrets")


async def keepalive_loop():
    import asyncio
    import httpx

    if not settings.frontend_url:
        return

    while True:
        await asyncio.sleep(600)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.get(settings.frontend_url)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    global cleanup_task, keepalive_task

    # Initialize database
    from app.storage import storage
    await storage.init()

    cleanup_task = asyncio.create_task(cleanup_loop())
    keepalive_task = asyncio.create_task(keepalive_loop())
    yield
    cleanup_task.cancel()
    keepalive_task.cancel()


app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(secrets_router)
app.include_router(files_router)
app.include_router(api_keys_router)
app.include_router(audit_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/info")
async def info():
    return {
        "name": "Poof",
        "version": "0.1.0",
        "description": "Secure one-time secret sharing",
        "links": {
            "docs": "/docs",
            "github": "https://github.com/sumitjhaa/poof",
        },
    }
