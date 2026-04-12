from __future__ import annotations

from app.domain.hybrid_risk import (
    hybrid_risk_score,
    ml_score_from_probabilities,
    risk_level_from_score,
    rule_based_risk_score,
)


def test_risk_level_bands() -> None:
    assert risk_level_from_score(0.0) == "LOW"
    assert risk_level_from_score(29.9) == "LOW"
    assert risk_level_from_score(30.0) == "MODERATE"
    assert risk_level_from_score(59.0) == "MODERATE"
    assert risk_level_from_score(60.0) == "HIGH"
    assert risk_level_from_score(79.0) == "HIGH"
    assert risk_level_from_score(80.0) == "CRITICAL"
    assert risk_level_from_score(100.0) == "CRITICAL"


def test_ml_score_from_probabilities_weighted_centroid() -> None:
    s = ml_score_from_probabilities({"LOW": 1.0})
    assert abs(s - 15.0) < 1e-6
    s2 = ml_score_from_probabilities({"LOW": 0.5, "HIGH": 0.5})
    assert abs(s2 - 42.5) < 1e-6


def test_hybrid_score_is_blend() -> None:
    h = hybrid_risk_score(100.0, 0.0, ml_weight=0.5, rule_weight=0.5)
    assert abs(h - 50.0) < 1e-6


def test_rule_score_no_income_with_expense() -> None:
    assert rule_based_risk_score(
        {
            "total_income": 0.0,
            "total_expense": 5000.0,
            "savings_ratio": -1.0,
            "expense_growth": 0.0,
            "rolling_avg_spend": 100.0,
        },
    ) > 50.0
