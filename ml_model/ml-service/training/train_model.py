from __future__ import annotations

import logging
import os
import random
import sys
from datetime import date, timedelta
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from training.constants import (
    ISO_CONTAMINATION,
    ISO_N_ESTIMATORS,
    RANDOM_STATE,
    RF_MAX_DEPTH,
    RF_MIN_SAMPLES_LEAF,
    RF_N_ESTIMATORS,
    SYNTHETIC_CRITICAL_FRACTION,
    SYNTHETIC_N_SAMPLES,
    TRAIN_TEST_SPLIT,
)
from training.feature_engineering import (
    all_feature_names as build_all_feature_names,
    feature_vector,
    label_from_features,
    transactions_to_feature_dict,
)
from training.features_spec import NUMERIC_FEATURE_NAMES, category_ratio_key

logger = logging.getLogger(__name__)


def _configure_cli_logging() -> None:
    try:
        from app.core.logging_config import setup_rich_logging

        setup_rich_logging("INFO")
    except ImportError:
        try:
            from rich.console import Console
            from rich.highlighter import ReprHighlighter
            from rich.logging import RichHandler
            from rich.theme import Theme
            from rich.traceback import install as install_rich_traceback

            use_color = not os.environ.get("NO_COLOR") and (
                os.environ.get("FORCE_COLOR", "").lower() in ("1", "true", "yes")
                or sys.stdout.isatty()
            )
            theme = Theme(
                {
                    "logging.level.debug": "italic dim cyan",
                    "logging.level.info": "bold chartreuse1",
                    "logging.level.warning": "bold gold1",
                    "logging.level.error": "bold bright_red",
                    "logging.level.critical": "bold white on bright_red",
                    "log.time": "bright_blue",
                    "log.path": "magenta",
                    "repr.str": "spring_green1",
                    "repr.number": "bright_cyan",
                    "repr.attrib_name": "yellow",
                    "repr.attrib_value": "bright_white",
                },
            )
            console = Console(
                file=sys.stdout,
                soft_wrap=True,
                theme=theme,
                force_terminal=use_color,
                color_system="truecolor" if use_color else None,
                highlight=True,
            )
            install_rich_traceback(show_locals=False, suppress=[logging])
            logging.basicConfig(
                level=logging.INFO,
                format="%(message)s",
                handlers=[
                    RichHandler(
                        console=console,
                        rich_tracebacks=True,
                        show_path=True,
                        markup=True,
                        highlighter=ReprHighlighter(),
                    ),
                ],
                force=True,
            )
        except ImportError:
            logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def _synthetic_user_transactions(rng: random.Random) -> list[dict[str, object]]:
    income_base = rng.uniform(2000, 120_000)
    if rng.random() < SYNTHETIC_CRITICAL_FRACTION:
        expense_bias = rng.uniform(1.48, 2.15)
    else:
        expense_bias = rng.uniform(0.4, 1.35)
    n_tx = rng.randint(8, 45)
    categories = [
        "Food",
        "Rent",
        "Transport",
        "Utilities",
        "Entertainment",
        "Shopping",
        "Health",
    ]

    txs: list[dict[str, object]] = []
    start = date(2024, 1, 1) + timedelta(days=rng.randint(0, 300))

    pay = max(income_base * rng.uniform(0.8, 1.1), 500)
    txs.append(
        {
            "amount": round(pay, 2),
            "category": "Salary",
            "type": "income",
            "date": start.isoformat(),
        },
    )

    remaining = income_base * expense_bias
    for i in range(n_tx - 1):
        cat = rng.choice(categories)
        amt = rng.uniform(20, min(5000, max(remaining * 0.12, 50)))
        day = start + timedelta(days=i + 1)
        txs.append(
            {
                "amount": round(amt, 2),
                "category": cat,
                "type": "expense",
                "date": day.isoformat(),
            },
        )
        remaining -= amt

    return txs


def _norm_type(raw: object) -> str:
    if raw is None:
        return ""
    return str(raw).strip().lower()


def _categories_from_transactions(txs_list: list[list[dict[str, object]]]) -> list[str]:
    seen: set[str] = set()
    for txs in txs_list:
        for row in txs:
            if _norm_type(row.get("type")) == "expense":
                c = str(row.get("category") or "unknown").strip() or "unknown"
                seen.add(c)
    return sorted(seen)


def build_dataset(
    n_samples: int = SYNTHETIC_N_SAMPLES,
    seed: int = RANDOM_STATE,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    rng = random.Random(seed)
    txs_list: list[list[dict[str, object]]] = []
    labels: list[str] = []

    for _ in range(n_samples):
        txs = _synthetic_user_transactions(rng)
        txs_list.append(txs)
        fd0 = transactions_to_feature_dict(txs, category_order=None)
        labels.append(label_from_features(fd0))

    category_order = _categories_from_transactions(txs_list)
    cat_keys = [category_ratio_key(c) for c in category_order]

    x_rows: list[list[float]] = []
    for txs in txs_list:
        fd = transactions_to_feature_dict(txs, category_order=category_order)
        x_rows.append(feature_vector(fd, NUMERIC_FEATURE_NAMES, cat_keys))

    y = np.array(labels)
    return np.asarray(x_rows, dtype=np.float64), y, category_order


def main() -> None:
    _configure_cli_logging()
    logger.info(
        "Building synthetic dataset (n_samples=%s, seed=%s)",
        SYNTHETIC_N_SAMPLES,
        RANDOM_STATE,
    )
    x_matrix, y, category_order = build_dataset()
    logger.info(
        "Dataset ready: X.shape=%s y.shape=%s distinct_expense_categories=%s",
        x_matrix.shape,
        y.shape,
        len(category_order),
    )
    cat_keys = [category_ratio_key(c) for c in category_order]
    names_all = build_all_feature_names(NUMERIC_FEATURE_NAMES, cat_keys)

    x_train, x_test, y_train, y_test = train_test_split(
        x_matrix,
        y,
        test_size=TRAIN_TEST_SPLIT,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    logger.info(
        "Training RandomForestClassifier (trees=%s, max_depth=%s)",
        RF_N_ESTIMATORS,
        RF_MAX_DEPTH,
    )
    risk_clf = RandomForestClassifier(
        n_estimators=RF_N_ESTIMATORS,
        max_depth=RF_MAX_DEPTH,
        min_samples_leaf=RF_MIN_SAMPLES_LEAF,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    risk_clf.fit(x_train, y_train)
    pred = risk_clf.predict(x_test)
    logger.info("Holdout accuracy: %s", accuracy_score(y_test, pred))
    logger.info("Classification report:\n%s", classification_report(y_test, pred, zero_division=0))

    logger.info(
        "Fitting IsolationForest (trees=%s, contamination=%s)",
        ISO_N_ESTIMATORS,
        ISO_CONTAMINATION,
    )
    iso = IsolationForest(
        n_estimators=ISO_N_ESTIMATORS,
        contamination=ISO_CONTAMINATION,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    iso.fit(x_train)

    model_dir = _ROOT / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    bundle: dict[str, object] = {
        "risk_classifier": risk_clf,
        "anomaly_detector": iso,
        "numeric_feature_names": list(NUMERIC_FEATURE_NAMES),
        "category_order": list(category_order),
        "category_feature_names": cat_keys,
        "all_feature_names": names_all,
        "classes": list(risk_clf.classes_),
    }
    path = model_dir / "model.pkl"
    joblib.dump(bundle, path)
    logger.info("Saved model bundle to [bold cyan]%s[/bold cyan]", path)


if __name__ == "__main__":
    main()
