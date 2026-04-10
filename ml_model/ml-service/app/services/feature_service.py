from __future__ import annotations

import logging
from typing import Any, Mapping, Sequence

from app.core.log import get_logger
from training.feature_engineering import feature_vector, transactions_to_feature_dict
from training.features_spec import CAT_RATIO_PREFIX

logger = get_logger(__name__)


def transactions_to_features(
    transactions: Sequence[Mapping[str, Any]],
    category_order: Sequence[str],
    numeric_names: Sequence[str],
    category_feature_names: Sequence[str],
) -> tuple[dict[str, float], list[float]]:
    feature_map = transactions_to_feature_dict(
        transactions,
        category_order=category_order,
    )
    vector = feature_vector(feature_map, numeric_names, category_feature_names)
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "transactions_to_features: tx_count=%s vector_dim=%s",
            len(transactions),
            len(vector),
        )
    return feature_map, vector


def response_feature_payload(feature_map: Mapping[str, float]) -> dict[str, Any]:
    core = {
        "total_income": feature_map.get("total_income", 0.0),
        "total_expense": feature_map.get("total_expense", 0.0),
        "net_balance": feature_map.get("net_balance", 0.0),
        "savings_ratio": feature_map.get("savings_ratio", 0.0),
        "transaction_count": int(feature_map.get("transaction_count", 0.0)),
        "avg_transaction_value": feature_map.get("avg_transaction_value", 0.0),
        "rolling_avg_spend": feature_map.get("rolling_avg_spend", 0.0),
        "transaction_frequency": feature_map.get("transaction_frequency", 0.0),
        "expense_growth": feature_map.get("expense_growth", 0.0),
    }
    ratios: dict[str, float] = {}
    prefix_len = len(CAT_RATIO_PREFIX)
    for key, value in feature_map.items():
        if key.startswith(CAT_RATIO_PREFIX):
            ratios[key[prefix_len:]] = float(value)
    payload: dict[str, Any] = {**core}
    if ratios:
        payload["category_expense_ratios"] = ratios
    return payload
