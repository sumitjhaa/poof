from datetime import datetime, timezone
from pydantic import BaseModel, Field


class SecretCreate(BaseModel):
    encrypted_data: str = Field(..., min_length=1, max_length=1048576)  # 1MB max
    expires_in: int = Field(default=3600, ge=60, le=2592000)  # 1 min to 30 days
    max_views: int = Field(default=1, ge=1, le=10)


class SecretResponse(BaseModel):
    id: str
    created_at: datetime
    expires_at: datetime
    url: str


class SecretRead(BaseModel):
    id: str
    encrypted_data: str
    created_at: datetime
    expires_at: datetime
    views_remaining: int


class ErrorResponse(BaseModel):
    error: str
    message: str
