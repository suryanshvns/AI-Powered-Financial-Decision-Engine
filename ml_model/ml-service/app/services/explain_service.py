from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

import numpy as np
from training.features_spec import CAT_RATIO_PREFIX

from app.core.log import get_logger
from app.domain import financial_rules as fr
from app.services import model_service

logger = get_logger(__name__)

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _slug(text: str) -> str:
    s = _NON_ALNUM.sub("_", text.strip().lower()).strip("_")
    return s or "unknown"


def _importance_display_key(feature_name: str) -> str:
    if feature_name.startswith(CAT_RATIO_PREFIX):
        raw = feature_name[len(CAT_RATIO_PREFIX) :]
        return f"{_slug(raw)}_spending"
    return feature_name


def _rule_based_reasons(features: Mapping[str, Any], risk_level: str) -> list[str]:
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
            "Low savings ratio",
        ),
        (
            lambda: fr.EXPLAIN_DEEP_NEGATIVE_SAVINGS <= sr < fr.EXPLAIN_LOW_SAVINGS,
            "Low savings ratio relative to income",
        ),
        (
            lambda: sr < fr.EXPLAIN_MODERATE_SAVINGS
            and risk_level in {"MODERATE", "HIGH", "CRITICAL"},
            "Moderate savings buffer",
        ),
        (
            lambda: growth > fr.EXPLAIN_HIGH_EXPENSE_GROWTH,
            "High expense growth in the second half of the period",
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
            "High recent average spend vs income",
        ),
    ]

    for condition, message in rules:
        if condition():
            reasons.append(message)

    ratios = features.get("category_expense_ratios")
    if isinstance(ratios, Mapping):
        for cat, raw in ratios.items():
            try:
                share = float(raw)
            except (TypeError, ValueError):
                continue
            if share >= 0.28:
                label = str(cat).strip() or "Category"
                reasons.append(f"High {label} spending")

    return reasons


def _shap_contributions_row(
    bundle: dict[str, Any],
    feature_vector: list[float],
    model_predicted_class: str,
) -> tuple[list[str], np.ndarray] | None:
    names: list[str] = list(bundle.get("all_feature_names", []))
    if len(names) != len(feature_vector):
        return None

    try:
        explainer = model_service.shap_explainer_for_risk_model()
        if explainer is None:
            return None
        x = np.asarray([feature_vector], dtype=np.float64)
        shap_vals = explainer.shap_values(x)
    except Exception:
        logger.debug("SHAP values skipped", exc_info=True)
        return None

    model = bundle["risk_classifier"]
    classes = [str(c) for c in model.classes_.tolist()]
    try:
        class_index = classes.index(model_predicted_class)
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
        return None
    return names, row


def compute_feature_importance(
    bundle: dict[str, Any],
    feature_vector: list[float],
    model_predicted_risk: str,
    top_k: int = 12,
) -> dict[str, float]:
    parsed = _shap_contributions_row(bundle, feature_vector, model_predicted_risk)
    if parsed is None:
        return {}
    names, row = parsed
    pairs = sorted(
        zip(names, np.abs(row.astype(np.float64))),
        key=lambda t: float(t[1]),
        reverse=True,
    )
    top = pairs[: max(1, top_k)]
    mass = sum(float(v) for _, v in top)
    if mass <= 0.0:
        return {}
    out: dict[str, float] = {}
    for name, raw in top:
        key = _importance_display_key(str(name))
        val = float(raw) / mass
        if val <= 1e-12:
            continue
        out[key] = out.get(key, 0.0) + val
    return out


def build_reasons(
    features_payload: Mapping[str, Any],
    risk_level: str,
    is_anomaly: bool,
) -> list[str]:
    out = _rule_based_reasons(features_payload, risk_level)
    if is_anomaly:
        out.append("Spending pattern is anomalous compared to typical profiles")
    return out
