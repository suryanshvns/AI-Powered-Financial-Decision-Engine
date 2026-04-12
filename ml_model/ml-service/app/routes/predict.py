from __future__ import annotations

from fastapi import APIRouter

from app.core.log import get_logger
from app.deps import ModelBundleDep
from app.domain.hybrid_risk import (
    hybrid_risk_score,
    ml_score_from_probabilities,
    risk_level_from_score,
    rule_based_risk_score,
)
from app.schemas.predict_schema import PredictRequest, PredictResponse
from app.services import explain_service, feature_service, model_service

logger = get_logger(__name__)
router = APIRouter(prefix="", tags=["predict"])


@router.post("/predict", response_model=PredictResponse)
def predict_endpoint(body: PredictRequest, bundle: ModelBundleDep) -> PredictResponse:
    transactions = [tx.model_dump(exclude_none=False) for tx in body.transactions]

    feature_map, vector = feature_service.transactions_to_features(
        transactions,
        bundle["category_order"],
        bundle["numeric_feature_names"],
        bundle["category_feature_names"],
    )
    ml_label, class_proba, _ = model_service.predict_risk_detail(vector)
    anomaly = model_service.predict_anomaly(vector)

    ml_part = ml_score_from_probabilities(class_proba)
    rules_part = rule_based_risk_score(feature_map)
    risk_score = hybrid_risk_score(ml_part, rules_part)
    risk_level = risk_level_from_score(risk_score)

    payload = feature_service.response_feature_payload(feature_map)
    reasons = explain_service.build_reasons(payload, risk_level, anomaly)
    feature_importance = explain_service.compute_feature_importance(
        bundle,
        vector,
        ml_label,
    )

    logger.info(
        "predict: risk_score=%.2f risk_level=%s anomaly=%s ml_label=%s transactions=%s",
        risk_score,
        risk_level,
        anomaly,
        ml_label,
        len(body.transactions),
    )

    return PredictResponse(
        risk_score=round(risk_score, 2),
        risk_level=risk_level,
        anomaly=anomaly,
        reasons=reasons,
        features=payload,
        feature_importance=feature_importance,
    )
