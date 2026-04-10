from __future__ import annotations

from typing import Final

ROLLING_EXPENSE_WINDOW: Final[int] = 7
NUMERIC_EPS: Final[float] = 1e-6

CRITICAL_EXPENSE_NO_INCOME: Final[float] = 8000.0
CRITICAL_OVERRUN_RATIO: Final[float] = 1.45
CRITICAL_SAVINGS_RATIO: Final[float] = -0.45
HIGH_SAVINGS_THRESHOLD: Final[float] = 0.2
MEDIUM_SAVINGS_THRESHOLD: Final[float] = 0.35
MEDIUM_OVERRUN_RATIO: Final[float] = 0.92
TIGHT_NET_BALANCE_INCOME_SHARE: Final[float] = 0.05

RANDOM_STATE: Final[int] = 42
TRAIN_TEST_SPLIT: Final[float] = 0.2

RF_N_ESTIMATORS: Final[int] = 250
RF_MAX_DEPTH: Final[int] = 16
RF_MIN_SAMPLES_LEAF: Final[int] = 2

ISO_N_ESTIMATORS: Final[int] = 200
ISO_CONTAMINATION: Final[float] = 0.06

SYNTHETIC_N_SAMPLES: Final[int] = 3000
SYNTHETIC_CRITICAL_FRACTION: Final[float] = 0.08
