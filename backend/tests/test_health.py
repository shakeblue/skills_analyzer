"""Tests for the health check endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_health_check_returns_200() -> None:
    """Test that the health check endpoint returns a 200 status code."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_check_returns_healthy_status() -> None:
    """Test that the health check endpoint returns the expected JSON body."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")

    data = response.json()
    assert data == {"status": "healthy"}
