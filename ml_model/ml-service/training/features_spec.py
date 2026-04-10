from __future__ import annotations

from typing import Final

CAT_RATIO_PREFIX: Final[str] = "cat_ratio__"

NUMERIC_FEATURE_NAMES: Final[tuple[str, ...]] = (
    "total_income",
    "total_expense",
    "net_balance",
    "savings_ratio",
    "transaction_count",
    "avg_transaction_value",
    "rolling_avg_spend",
    "transaction_frequency",
    "expense_growth",
)


def category_ratio_key(category: str) -> str:
    return f"{CAT_RATIO_PREFIX}{category}"
