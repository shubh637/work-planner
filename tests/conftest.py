import pytest
import requests

BASE = "http://localhost:8080/api"


def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    return r.json().get("token", "")


@pytest.fixture(scope="session")
def manager_token():
    return login("admin@workplanner.com", "admin123")


@pytest.fixture(scope="session")
def member_token():
    return login("testmember@test.com", "test123")


@pytest.fixture(scope="session")
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture(scope="session")
def member_headers(member_token):
    return {"Authorization": f"Bearer {member_token}"}


@pytest.fixture(scope="session")
def active_project(manager_headers):
    """Create a fresh active project for the test session."""
    r = requests.post(f"{BASE}/projects", json={"name": "Test Session Project"}, headers=manager_headers)
    assert r.status_code == 201
    return r.json()


@pytest.fixture(scope="session")
def done_project(manager_headers):
    """Create a project and mark it DONE."""
    r = requests.post(f"{BASE}/projects", json={"name": "DONE Session Project"}, headers=manager_headers)
    assert r.status_code == 201
    pid = r.json()["id"]
    requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
    requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "DONE"}, headers=manager_headers)
    return r.json() | {"id": pid}


@pytest.fixture(scope="session")
def test_member_id():
    """ID of testmember@test.com — created in setup."""
    return 10
