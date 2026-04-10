from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TransactionIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

    amount: float
    category: Optional[str] = None
    type: str
    user_id: Optional[str] = None
    date: Optional[str] = None
    merchant: Optional[str] = None

    @field_validator("type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in ("income", "expense"):
            msg = "type must be 'income' or 'expense'"
            raise ValueError(msg)
        return normalized

    @field_validator("amount")
    @classmethod
    def amount_finite(cls, value: float) -> float:
        if value != value or value in (float("inf"), float("-inf")):
            msg = "amount must be a finite number"
            raise ValueError(msg)
        return value


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transactions: list[TransactionIn] = Field(..., min_length=1)


RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class PredictResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    risk: RiskLevel
    score: float = Field(..., ge=0.0, le=1.0)
    anomaly: bool
    features: dict[str, Any]
    reasons: list[str] = Field(default_factory=list)
