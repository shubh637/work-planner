"""
Authentication edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestAuthLogin:
    def test_valid_manager_login_returns_token(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@workplanner.com", "password": "admin123"})
        assert r.status_code == 200
        assert "token" in r.json()
        assert r.json()["role"] == "MANAGER"

    def test_valid_member_login_returns_token(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "testmember@test.com", "password": "test123"})
        assert r.status_code == 200
        assert "token" in r.json()
        assert r.json()["role"] == "TEAM_MEMBER"

    def test_wrong_password_returns_401(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@workplanner.com", "password": "wrong"})
        assert r.status_code == 401

    def test_nonexistent_email_returns_401(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "ghost@nowhere.com", "password": "pass"})
        assert r.status_code == 401

    def test_invalid_email_format_returns_400(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "notanemail", "password": "pass"})
        assert r.status_code == 400

    def test_empty_body_returns_400(self):
        r = requests.post(f"{BASE}/auth/login", json={})
        assert r.status_code == 400

    def test_missing_password_field_returns_400(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@workplanner.com"})
        assert r.status_code == 400

    def test_missing_email_field_returns_400(self):
        r = requests.post(f"{BASE}/auth/login", json={"password": "admin123"})
        assert r.status_code == 400

    def test_no_token_on_protected_endpoint_returns_403(self):
        r = requests.get(f"{BASE}/projects")
        assert r.status_code == 403

    def test_invalid_token_returns_403(self):
        r = requests.get(f"{BASE}/projects", headers={"Authorization": "Bearer invalidtoken"})
        assert r.status_code == 403

    def test_expired_token_format_returns_403(self):
        fake = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIn0.fakesignature"
        r = requests.get(f"{BASE}/projects", headers={"Authorization": f"Bearer {fake}"})
        assert r.status_code == 403

    def test_sql_injection_in_email_returns_401_or_400(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "' OR 1=1;--", "password": "pass"})
        assert r.status_code in (400, 401)

    def test_xss_in_email_handled_safely(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "<script>alert(1)</script>@x.com", "password": "x"})
        assert r.status_code in (400, 401)
