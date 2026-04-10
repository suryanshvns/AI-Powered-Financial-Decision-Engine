from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_model_loaded_flag() -> None:
    client = TestClient(create_app())
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "model_loaded" in body
