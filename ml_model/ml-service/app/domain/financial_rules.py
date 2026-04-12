from __future__ import annotations

from typing import Final

EXPLAIN_CRITICAL_OVERRUN: Final[float] = 1.45
EXPLAIN_DEEP_NEGATIVE_SAVINGS: Final[float] = -0.45
EXPLAIN_LOW_SAVINGS: Final[float] = 0.2
EXPLAIN_MODERATE_SAVINGS: Final[float] = 0.35
EXPLAIN_HIGH_EXPENSE_GROWTH: Final[float] = 0.35
EXPLAIN_DECLINING_EXPENSES: Final[float] = -0.25
EXPLAIN_HIGH_FREQUENCY: Final[float] = 3.0
EXPLAIN_TIGHT_CASHFLOW_EXPENSE_SHARE: Final[float] = 0.85
EXPLAIN_ROLLING_VS_INCOME: Final[float] = 0.25

RISK_LEVELS_ORDERED: Final[tuple[str, ...]] = ("LOW", "MODERATE", "HIGH", "CRITICAL")
