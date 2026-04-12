from __future__ import annotations

import math
from collections.abc import Mapping
from typing import Final, Literal

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]

# Blend ML expected score (from class probabilities) with rule-based score.
ML_WEIGHT: Final[float] = 0.55
RULE_WEIGHT: Final[float] = 0.45

# Representative score (0–100) per trained class label for probability weighting.
_CLASS_CENTROIDS: Final[dict[str, float]] = {
    "LOW": 15.0,
    "MEDIUM": 45.0,
    "HIGH": 70.0,
    "CRITICAL": 90.0,
}

_SCORE_LOW_MAX: Final[float] = 30.0
_SCORE_MODERATE_MAX: Final[float] = 60.0
_SCORE_HIGH_MAX: Final[float] = 80.0


def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
    if math.isnan(x) or math.isinf(x):
        return lo
    return max(lo, min(hi, x))


def _centroid_for_class(label: str) -> float:
    key = str(label).strip().upper()
    return _CLASS_CENTROIDS.get(key, 45.0)


def ml_score_from_probabilities(class_to_probability: Mapping[str, float]) -> float:
    if not class_to_probability:
        return 50.0
    total = 0.0
    for cls, raw_p in class_to_probability.items():
        try:
            p = float(raw_p)
        except (TypeError, ValueError):
            continue
        if p <= 0.0 or math.isnan(p):
            continue
        total += p * _centroid_for_class(str(cls))
    if total <= 0.0:
        return 50.0
    return _clamp(total)


def rule_based_risk_score(features: Mapping[str, float]) -> float:
    income = float(features.get("total_income", 0.0) or 0.0)
    expense = float(features.get("total_expense", 0.0) or 0.0)
    sr = float(features.get("savings_ratio", 0.0) or 0.0)
    growth = float(features.get("expense_growth", 0.0) or 0.0)
    rolling = float(features.get("rolling_avg_spend", 0.0) or 0.0)

    if income <= 0.0 and expense <= 0.0:
        return 5.0

    if income <= 0.0:
        # Spending with no declared income: scale by expense severity.
        return _clamp(55.0 + min(45.0, expense / 200.0))

    overrun = expense / max(income, 1e-9)
    overrun_stress = _clamp((overrun - 0.55) / (1.45 - 0.55) * 100.0)

    # Lower savings_ratio => higher stress; map roughly [-1, 0.35] -> [100, 0]
    span = 1.35 - (-1.0)
    savings_stress = _clamp(100.0 * (0.35 - sr) / span)

    growth_stress = _clamp(max(0.0, growth) / 0.85 * 100.0)
    rolling_ratio = rolling / income
    rolling_stress = _clamp(max(0.0, rolling_ratio - 0.12) / 0.55 * 100.0)

    combined = (
        0.35 * overrun_stress
        + 0.35 * savings_stress
        + 0.15 * growth_stress
        + 0.15 * rolling_stress
    )
    return _clamp(combined)


def hybrid_risk_score(
    ml_score: float,
    rules_score: float,
    ml_weight: float = ML_WEIGHT,
    rule_weight: float = RULE_WEIGHT,
) -> float:
    w_ml = max(0.0, min(1.0, ml_weight))
    w_rule = max(0.0, min(1.0, rule_weight))
    norm = w_ml + w_rule
    if norm <= 0.0:
        return _clamp(0.5 * (ml_score + rules_score))
    return _clamp((w_ml * ml_score + w_rule * rules_score) / norm)


def risk_level_from_score(score: float) -> RiskLevel:
    s = _clamp(score)
    if s < _SCORE_LOW_MAX:
        return "LOW"
    if s < _SCORE_MODERATE_MAX:
        return "MODERATE"
    if s < _SCORE_HIGH_MAX:
        return "HIGH"
    return "CRITICAL"
