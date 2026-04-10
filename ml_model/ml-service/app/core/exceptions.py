from __future__ import annotations


class ServiceError(Exception):
    """Base error for application services."""


class ModelNotLoadedError(ServiceError):
    """Raised when the model bundle is missing or was not loaded at startup."""


class InvalidModelBundleError(ServiceError):
    """Raised when model.pkl exists but has an incompatible schema."""
