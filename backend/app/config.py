from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Poof"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
