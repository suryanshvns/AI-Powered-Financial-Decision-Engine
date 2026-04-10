from __future__ import annotations

from typing import cast

from fastapi import APIRouter

from app.core.log import get_logger
from app.deps import ModelBundleDep
from app.domain.financial_rules import RISK_LEVELS_ORDERED
from app.schemas.predict_schema import PredictRequest, PredictResponse, RiskLevel
from app.services import explain_service, feature_service, model_service

logger = get_logger(__name__)
router = APIRouter(prefix="", tags=["predict"])


def _normalize_risk_label(raw: str) -> RiskLevel:
    if raw in RISK_LEVELS_ORDERED:
        return cast(RiskLevel, raw)
    logger.error("Unexpected risk label from classifier: %r; defaulting to MEDIUM", raw)
    return "MEDIUM"


@router.post("/predict", response_model=PredictResponse)
def predict_endpoint(body: PredictRequest, bundle: ModelBundleDep) -> PredictResponse:
    transactions = [tx.model_dump(exclude_none=False) for tx in body.transactions]

    feature_map, vector = feature_service.transactions_to_features(
        transactions,
        bundle["category_order"],
        bundle["numeric_feature_names"],
        bundle["category_feature_names"],
    )
    risk_raw, score = model_service.predict_risk(vector)
    anomaly = model_service.predict_anomaly(vector)
    payload = feature_service.response_feature_payload(feature_map)
    reasons = explain_service.build_reasons(payload, risk_raw, vector, bundle, anomaly)
    risk = _normalize_risk_label(risk_raw)

    logger.info(
        "predict: risk=%s score=%.4f anomaly=%s transactions=%s",
        risk,
        score,
        anomaly,
        len(body.transactions),
    )

    return PredictResponse(
        risk=risk,
        score=score,
        anomaly=anomaly,
        features=payload,
        reasons=reasons,
    )
