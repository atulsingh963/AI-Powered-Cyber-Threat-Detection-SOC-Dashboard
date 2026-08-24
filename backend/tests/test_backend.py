import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "CyberSentinel AI"
    assert data["status"] == "ONLINE"


def test_health_check():
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "api" in data
    assert data["api"] == "ONLINE"


def test_login_demo_admin():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@cybersentinel.ai",
        "password": "Admin123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@cybersentinel.ai"


def test_ingest_brute_force_event():
    # Ingest 10 failed login events from single IP
    for i in range(10):
        res = client.post("/api/v1/events/ingest", json={
            "event_type": "authentication_failure",
            "source": "linux_auth",
            "source_ip": "198.51.100.99",
            "destination_ip": "10.0.0.1",
            "source_port": 50000 + i,
            "destination_port": 22,
            "username": "root",
            "hostname": "server-prod-auth",
            "message": f"Failed password for root from 198.51.100.99 port {50000+i} ssh2",
            "severity": "medium",
            "raw_log": f"Failed password for root from 198.51.100.99 port {50000+i} ssh2"
        })
        assert res.status_code == 200

    # Query incidents to verify correlation created an incident
    inc_res = client.get("/api/v1/incidents")
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    assert len(incidents) > 0


def test_ai_analysis_fallback():
    # Fetch an incident
    inc_res = client.get("/api/v1/incidents")
    incidents = inc_res.json()
    if incidents:
        inc_id = incidents[0]["id"]
        ai_res = client.post(f"/api/v1/ai/analyze/{inc_id}")
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert "summary" in ai_data
        assert len(ai_data["recommendations"]) > 0
