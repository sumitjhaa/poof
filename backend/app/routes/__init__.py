from fastapi import APIRouter

from app.routes.create import router as create_router
from app.routes.read import router as read_router
from app.routes.delete import router as delete_router

router = APIRouter(prefix="/api/secrets", tags=["secrets"])
router.include_router(create_router)
router.include_router(read_router)
router.include_router(delete_router)
