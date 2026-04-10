from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="FDE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    model_bundle_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "model" / "model.pkl",
    )
    cors_origins: str = "*"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    app_title: str = "Financial Risk ML Service"
    app_version: str = "2.0.0"

    @model_validator(mode="after")
    def resolve_model_bundle_path(self) -> Settings:
        resolved = self.model_bundle_path.expanduser().resolve()
        self.model_bundle_path = resolved
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw == "*":
            return ["*"]
        return [p.strip() for p in raw.split(",") if p.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
