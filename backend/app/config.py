import json
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    app_name: str = "Poof"
    debug: bool = False
    allowed_origins: str = "http://localhost:3000"

    def get_allowed_origins(self) -> list[str]:
        try:
            parsed = json.loads(self.allowed_origins)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
