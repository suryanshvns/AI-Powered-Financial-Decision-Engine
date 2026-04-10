from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Dict, Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.log import get_logger
from app.core.logging_config import configure_logging
from app.routes.predict import router as predict_router
from app.services import model_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    loaded = model_service.preload_models()
    if loaded:
        logger.info("Application startup complete; model bundle ready")
    else:
        logger.warning("Application started without a model bundle (predict will return 503)")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)
    application = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(predict_router)

    @application.get("/health")
    def health() -> Dict[str, Union[str, bool]]:
        return {"status": "ok", "model_loaded": model_service.models_loaded()}

    return application


app = create_app()
