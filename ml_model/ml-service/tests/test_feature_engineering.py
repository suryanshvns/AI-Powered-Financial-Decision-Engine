from __future__ import annotations

from training.feature_engineering import (
    label_risk_level,
    transactions_to_feature_dict,
)
from training.features_spec import NUMERIC_FEATURE_NAMES, category_ratio_key


def test_empty_transactions_yield_zero_features() -> None:
    result = transactions_to_feature_dict([], category_order=None)
    for name in NUMERIC_FEATURE_NAMES:
        assert result[name] == 0.0


def test_savings_ratio_with_positive_income() -> None:
    txs = [
        {"amount": 1000.0, "type": "income", "category": "Salary", "date": "2024-01-01"},
        {"amount": 400.0, "type": "expense", "category": "Food", "date": "2024-01-02"},
    ]
    fd = transactions_to_feature_dict(txs, category_order=None)
    assert fd["total_income"] == 1000.0
    assert fd["total_expense"] == 400.0
    assert fd["savings_ratio"] == 0.6


def test_category_order_includes_fixed_keys() -> None:
    txs = [
        {"amount": 100.0, "type": "expense", "category": "Food", "date": "2024-01-01"},
    ]
    order = ["Food", "Rent"]
    fd = transactions_to_feature_dict(txs, category_order=order)
    assert fd[category_ratio_key("Food")] == 1.0
    assert fd[category_ratio_key("Rent")] == 0.0


def test_label_critical_when_severe_overrun() -> None:
    assert label_risk_level(100.0, 150.0, -0.5, -50.0) == "CRITICAL"


def test_label_high_when_expenses_above_income_below_critical_overrun() -> None:
    assert label_risk_level(100.0, 120.0, -0.2, -20.0) == "HIGH"
