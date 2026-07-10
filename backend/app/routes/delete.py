from fastapi import APIRouter, HTTPException

from app.storage import storage

router = APIRouter()


@router.delete("/{id}", status_code=204)
async def delete_secret(id: str):
    if not await storage.delete(id):
        raise HTTPException(status_code=404, detail={"error": "not_found", "message": "Secret not found"})
    return None
