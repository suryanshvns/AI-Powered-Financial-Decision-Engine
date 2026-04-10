from __future__ import annotations

import logging
from typing import Any, Mapping

import numpy as np

from app.core.log import get_logger
from app.domain import financial_rules as fr
from app.services import model_service
from training.features_spec import CAT_RATIO_PREFIX

logger = get_logger(__name__)


def _rule_based_reasons(features: Mapping[str, Any], predicted_risk: str) -> list[str]:
    income = float(features.get("total_income", 0.0))
    expense = float(features.get("total_expense", 0.0))
    sr = float(features.get("savings_ratio", 0.0))
    growth = float(features.get("expense_growth", 0.0))
    freq = float(features.get("transaction_frequency", 0.0))
    rolling = float(features.get("rolling_avg_spend", 0.0))

    expense_ratio = expense / income if income > 0 else 0.0
    rolling_ratio = rolling / income if income > 0 else 0.0

    reasons: list[str] = []

    rules: list[tuple[object, str]] = [
        (
            lambda: income > 0 and expense_ratio >= fr.EXPLAIN_CRITICAL_OVERRUN,
            "Expenses are far above income (critical overrun)",
        ),
        (
            lambda: expense > income,
            "Expenses exceed income",
        ),
        (
            lambda: sr < fr.EXPLAIN_DEEP_NEGATIVE_SAVINGS,
            "Savings ratio is deeply negative",
        ),
        (
            lambda: sr < fr.EXPLAIN_LOW_SAVINGS,
            "Low savings ratio relative to income",
        ),
        (
            lambda: sr < fr.EXPLAIN_MODERATE_SAVINGS
            and predicted_risk in {"MEDIUM", "HIGH", "CRITICAL"},
            "Moderate savings buffer",
        ),
        (
            lambda: growth > fr.EXPLAIN_HIGH_EXPENSE_GROWTH,
            "Expense growth is elevated in the second half of the period",
        ),
        (
            lambda: growth < fr.EXPLAIN_DECLINING_EXPENSES,
            "Expenses declined in the second half vs the first",
        ),
        (
            lambda: freq > fr.EXPLAIN_HIGH_FREQUENCY
            and expense_ratio > fr.EXPLAIN_TIGHT_CASHFLOW_EXPENSE_SHARE,
            "High transaction frequency with tight cash flow",
        ),
        (
            lambda: rolling_ratio > fr.EXPLAIN_ROLLING_VS_INCOME,
            "Recent average spend is high vs income",
        ),
    ]

    for condition, message in rules:
        if condition():
            reasons.append(message)

    return reasons


def _shap_lines(
    bundle: dict[str, Any],
    feature_vector: list[float],
    predicted_risk: str,
    top_k: int = 4,
) -> list[str]:
    model = bundle["risk_classifier"]
    names: list[str] = list(bundle.get("all_feature_names", []))
    if len(names) != len(feature_vector):
        return []

    try:
        explainer = model_service.shap_explainer_for_risk_model()
        if explainer is None:
            return []
        x = np.asarray([feature_vector], dtype=np.float64)
        shap_vals = explainer.shap_values(x)
    except Exception:
        logger.debug("SHAP explanation skipped", exc_info=True)
        return []

    classes = [str(c) for c in model.classes_.tolist()]
    try:
        class_index = classes.index(predicted_risk)
    except ValueError:
        class_index = int(np.argmax(model.predict_proba(x)[0]))

    arr = np.asarray(shap_vals, dtype=np.float64)
    if arr.ndim == 3:
        row = arr[0, :, class_index].ravel()
    elif isinstance(shap_vals, list):
        row = np.asarray(shap_vals[class_index], dtype=np.float64).ravel()
    else:
        row = arr[0].ravel()
    if row.size != len(names):
        return []

    pairs = sorted(zip(names, row), key=lambda t: abs(float(t[1])), reverse=True)
    lines: list[str] = []
    for name, raw_val in pairs[:top_k]:
        val = float(raw_val)
        if abs(val) < 1e-8:
            continue
        direction = "raised" if val > 0 else "lowered"
        pretty = name.replace(CAT_RATIO_PREFIX, "category share — ")
        lines.append(
            f"SHAP: {pretty} {direction} the model toward this risk level ({val:+.4f})",
        )
    return lines


def build_reasons(
    features_payload: Mapping[str, Any],
    predicted_risk: str,
    feature_vector: list[float],
    bundle: dict[str, Any],
    is_anomaly: bool,
) -> list[str]:
    out = _rule_based_reasons(features_payload, predicted_risk)
    out.extend(_shap_lines(bundle, feature_vector, predicted_risk))
    if is_anomaly:
        out.append(
            "IsolationForest flagged this feature vector as anomalous vs training data",
        )
    return out
