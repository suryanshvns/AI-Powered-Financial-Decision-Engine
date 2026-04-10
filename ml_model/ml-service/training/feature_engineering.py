from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from typing import Any, Iterable, Mapping, Sequence

from training.constants import (
    CRITICAL_EXPENSE_NO_INCOME,
    CRITICAL_OVERRUN_RATIO,
    CRITICAL_SAVINGS_RATIO,
    HIGH_SAVINGS_THRESHOLD,
    TIGHT_NET_BALANCE_INCOME_SHARE,
    MEDIUM_OVERRUN_RATIO,
    MEDIUM_SAVINGS_THRESHOLD,
    NUMERIC_EPS,
    ROLLING_EXPENSE_WINDOW,
)
from training.features_spec import category_ratio_key


def _safe_float(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _norm_type(raw: Any) -> str:
    if raw is None:
        return ""
    return str(raw).strip().lower()


def _parse_date(row: Mapping[str, Any]) -> date | None:
    raw = row.get("date")
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    text = str(raw).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        pass
    try:
        return datetime.strptime(text[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _rolling_avg_spend(
    expense_rows: list[tuple[date | None, float]],
    window: int = ROLLING_EXPENSE_WINDOW,
) -> float:
    if not expense_rows:
        return 0.0
    dated = [(d, amt) for d, amt in expense_rows if d is not None]
    if len(dated) >= 2:
        dated.sort(key=lambda x: x[0])
        amounts = [amt for _, amt in dated]
    else:
        amounts = [amt for _, amt in expense_rows]
    tail = amounts[-min(window, len(amounts)) :]
    return sum(tail) / len(tail) if tail else 0.0


def _transaction_frequency(transaction_count: int, dates: list[date | None]) -> float:
    parsed = [d for d in dates if d is not None]
    if len(parsed) >= 2:
        span_days = max((max(parsed) - min(parsed)).days, 1)
        return float(transaction_count) / float(span_days)
    return float(transaction_count)


def _expense_growth(expense_rows: list[tuple[date | None, float]]) -> float:
    if len(expense_rows) < 2:
        return 0.0
    dated = [(d, amt) for d, amt in expense_rows if d is not None]
    if len(dated) >= 2:
        dated.sort(key=lambda x: x[0])
        amounts = [amt for _, amt in dated]
    else:
        amounts = [amt for _, amt in expense_rows]
    mid = len(amounts) // 2
    first_half = amounts[:mid] or [0.0]
    second_half = amounts[mid:] or [0.0]
    sum_first, sum_second = sum(first_half), sum(second_half)
    denom = max(sum_first, NUMERIC_EPS)
    return (sum_second - sum_first) / denom


def transactions_to_feature_dict(
    transactions: Sequence[Mapping[str, Any]],
    category_order: Sequence[str] | None = None,
) -> dict[str, float]:
    if not transactions:
        base = _empty_base_features()
        if category_order:
            for category in category_order:
                base[category_ratio_key(category)] = 0.0
        return base

    total_income = 0.0
    total_expense = 0.0
    category_expense: dict[str, float] = defaultdict(float)
    count = 0
    amount_sum_abs = 0.0
    row_dates: list[date | None] = []
    expense_series: list[tuple[date | None, float]] = []

    for row in transactions:
        amount = _safe_float(row.get("amount"))
        tx_type = _norm_type(row.get("type"))
        parsed_date = _parse_date(row)
        count += 1
        amount_sum_abs += abs(amount)
        row_dates.append(parsed_date)

        if tx_type == "income":
            total_income += max(amount, 0.0)
        elif tx_type == "expense":
            expense_amt = max(amount, 0.0)
            total_expense += expense_amt
            cat = str(row.get("category") or "unknown").strip() or "unknown"
            category_expense[cat] += expense_amt
            expense_series.append((parsed_date, expense_amt))

    net_balance = total_income - total_expense
    if total_income > 0:
        savings_ratio = (total_income - total_expense) / total_income
    else:
        savings_ratio = 0.0 if total_expense == 0 else -1.0

    avg_transaction_value = amount_sum_abs / count if count else 0.0
    expense_denom = total_expense if total_expense > 0 else 0.0
    raw_ratios: dict[str, float] = {}
    for cat, spent in category_expense.items():
        raw_ratios[cat] = spent / expense_denom if expense_denom > 0 else 0.0

    features: dict[str, float] = {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": net_balance,
        "savings_ratio": savings_ratio,
        "transaction_count": float(count),
        "avg_transaction_value": avg_transaction_value,
        "rolling_avg_spend": _rolling_avg_spend(expense_series),
        "transaction_frequency": _transaction_frequency(count, row_dates),
        "expense_growth": _expense_growth(expense_series),
    }

    categories: Iterable[str]
    if category_order is not None:
        categories = category_order
    else:
        categories = sorted(raw_ratios.keys())

    for category in categories:
        key = category_ratio_key(category)
        features[key] = float(raw_ratios.get(category, 0.0))

    return features


def _empty_base_features() -> dict[str, float]:
    return {
        "total_income": 0.0,
        "total_expense": 0.0,
        "net_balance": 0.0,
        "savings_ratio": 0.0,
        "transaction_count": 0.0,
        "avg_transaction_value": 0.0,
        "rolling_avg_spend": 0.0,
        "transaction_frequency": 0.0,
        "expense_growth": 0.0,
    }


def label_risk_level(
    total_income: float,
    total_expense: float,
    savings_ratio: float,
    net_balance: float,
) -> str:
    ti, te = total_income, total_expense

    if ti <= 0:
        if te <= 0:
            return "LOW"
        return "CRITICAL" if te >= CRITICAL_EXPENSE_NO_INCOME else "HIGH"

    overrun = te / ti

    if overrun >= CRITICAL_OVERRUN_RATIO or savings_ratio <= CRITICAL_SAVINGS_RATIO:
        return "CRITICAL"
    if te > ti or savings_ratio < HIGH_SAVINGS_THRESHOLD:
        return "HIGH"
    if (
        savings_ratio < MEDIUM_SAVINGS_THRESHOLD
        or overrun > MEDIUM_OVERRUN_RATIO
        or net_balance < TIGHT_NET_BALANCE_INCOME_SHARE * ti
    ):
        return "MEDIUM"
    return "LOW"


def label_from_features(feature_map: Mapping[str, float]) -> str:
    return label_risk_level(
        float(feature_map.get("total_income", 0.0)),
        float(feature_map.get("total_expense", 0.0)),
        float(feature_map.get("savings_ratio", 0.0)),
        float(feature_map.get("net_balance", 0.0)),
    )


def feature_vector(
    features: Mapping[str, float],
    numeric_feature_names: Sequence[str],
    category_feature_names: Sequence[str],
) -> list[float]:
    return [float(features.get(name, 0.0)) for name in numeric_feature_names] + [
        float(features.get(name, 0.0)) for name in category_feature_names
    ]


def all_feature_names(
    numeric_feature_names: Sequence[str],
    category_feature_names: Sequence[str],
) -> list[str]:
    return list(numeric_feature_names) + list(category_feature_names)


__all__ = [
    "all_feature_names",
    "feature_vector",
    "label_from_features",
    "label_risk_level",
    "transactions_to_feature_dict",
]
