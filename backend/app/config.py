import json
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    app_name: str = "Poof"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
