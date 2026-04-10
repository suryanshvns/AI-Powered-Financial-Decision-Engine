from __future__ import annotations

from typing import Any, TypedDict

from sklearn.ensemble import IsolationForest, RandomForestClassifier


class ModelBundle(TypedDict):
    risk_classifier: RandomForestClassifier
    anomaly_detector: IsolationForest
    numeric_feature_names: list[str]
    category_order: list[str]
    category_feature_names: list[str]
    all_feature_names: list[str]
    classes: list[Any]
