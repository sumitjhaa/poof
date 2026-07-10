from fastapi import APIRouter

from app.routes.create import router as create_router
from app.routes.read import router as read_router
from app.routes.delete import router as delete_router
from app.routes.files import router as files_router
from app.routes.api_keys import router as api_keys_router
from app.routes.audit import router as audit_router

router = APIRouter(prefix="/api/secrets", tags=["secrets"])
router.include_router(create_router)
router.include_router(read_router)
router.include_router(delete_router)

files = APIRouter(prefix="/api/files", tags=["files"])
files.include_router(files_router)

api_keys = APIRouter(prefix="/api/keys", tags=["api-keys"])
api_keys.include_router(api_keys_router)

audit = APIRouter(prefix="/api/audit", tags=["audit"])
audit.include_router(audit_router)
