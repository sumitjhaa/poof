from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    app_name: str = "Poof"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
