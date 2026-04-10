from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException

from app.core.exceptions import ModelNotLoadedError
from app.core.log import get_logger
from app.services import model_service
from app.types.bundle import ModelBundle

logger = get_logger(__name__)


def get_model_bundle() -> ModelBundle:
    try:
        return model_service.get_bundle()
    except ModelNotLoadedError as exc:
        logger.warning("predict blocked: model bundle unavailable (%s)", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc


ModelBundleDep = Annotated[ModelBundle, Depends(get_model_bundle)]
