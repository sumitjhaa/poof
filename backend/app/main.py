from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.secrets import router as secrets_router

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(secrets_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
