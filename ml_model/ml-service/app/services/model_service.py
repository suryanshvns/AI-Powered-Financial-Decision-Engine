from __future__ import annotations

import logging
from typing import Any, cast

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier

from app.core.config import get_settings
from app.core.exceptions import InvalidModelBundleError, ModelNotLoadedError
from app.core.log import get_logger
from app.types.bundle import ModelBundle

logger = get_logger(__name__)

_bundle: ModelBundle | None = None
_shap_explainer: Any = None


def _load_bundle_from_disk() -> ModelBundle:
    path = get_settings().model_bundle_path
    if not path.is_file():
        raise ModelNotLoadedError(f"Model bundle not found: {path}")
    raw = joblib.load(path)
    if not isinstance(raw, dict):
        raise InvalidModelBundleError("Model artifact must be a dict bundle")
    if "risk_classifier" not in raw or "anomaly_detector" not in raw:
        raise InvalidModelBundleError("Bundle missing risk_classifier or anomaly_detector")
    return cast(ModelBundle, raw)


def preload_models() -> bool:
    global _bundle, _shap_explainer
    _shap_explainer = None
    try:
        _bundle = _load_bundle_from_disk()
    except (ModelNotLoadedError, InvalidModelBundleError) as exc:
        _bundle = None
        logger.warning("Model preload failed: %s", exc)
        return False
    logger.info("Model bundle loaded from %s", get_settings().model_bundle_path)
    return True


def models_loaded() -> bool:
    return _bundle is not None


def get_bundle() -> ModelBundle:
    if _bundle is None:
        raise ModelNotLoadedError(
            "Models are not loaded. Train with `python -m training.train_model` "
            "and ensure FDE_MODEL_BUNDLE_PATH points to model.pkl",
        )
    return _bundle


def reload_models() -> ModelBundle:
    global _bundle, _shap_explainer
    _shap_explainer = None
    _bundle = _load_bundle_from_disk()
    logger.info("Model bundle reloaded from %s", get_settings().model_bundle_path)
    return _bundle


def _get_shap_explainer(rf: RandomForestClassifier) -> Any:
    global _shap_explainer
    if _shap_explainer is None:
        import shap

        _shap_explainer = shap.TreeExplainer(rf)
    return _shap_explainer


def shap_explainer_for_risk_model() -> Any | None:
    try:
        bundle = get_bundle()
        return _get_shap_explainer(bundle["risk_classifier"])
    except ImportError:
        logger.debug("SHAP import failed", exc_info=True)
        return None
    except ModelNotLoadedError:
        return None


def predict_risk(feature_vector: list[float]) -> tuple[str, float]:
    bundle = get_bundle()
    model = bundle["risk_classifier"]
    x = np.asarray([feature_vector], dtype=np.float64)
    pred = str(model.predict(x)[0])
    proba = model.predict_proba(x)[0]
    score = float(np.max(proba))
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "predict_risk: class=%s score=%.4f feature_dim=%s",
            pred,
            score,
            len(feature_vector),
        )
    return pred, score


def predict_anomaly(feature_vector: list[float]) -> bool:
    bundle = get_bundle()
    iso: IsolationForest = bundle["anomaly_detector"]
    x = np.asarray([feature_vector], dtype=np.float64)
    label = int(iso.predict(x)[0])
    is_outlier = label == -1
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "predict_anomaly: outlier=%s feature_dim=%s",
            is_outlier,
            len(feature_vector),
        )
    return is_outlier
