"""
Project management edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestProjects:
    def test_create_project_valid(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Test Proj Valid"}, headers=manager_headers)
        assert r.status_code == 201
        assert r.json()["status"] == "NOT_STARTED"
        requests.delete(f"{BASE}/projects/{r.json()['id']}", headers=manager_headers)

    def test_create_project_missing_name_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"description": "no name"}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_project_empty_name_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": ""}, headers=manager_headers)
        assert r.status_code == 400

    def test_member_cannot_create_project(self, member_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Member Proj"}, headers=member_headers)
        assert r.status_code == 403

    def test_get_all_projects_manager(self, manager_headers):
        r = requests.get(f"{BASE}/projects", headers=manager_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_all_projects_member_allowed(self, member_headers):
        r = requests.get(f"{BASE}/projects", headers=member_headers)
        assert r.status_code == 200

    def test_project_status_progression_not_started_to_in_progress(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Status Prog"}, headers=manager_headers)
        pid = r.json()["id"]
        r2 = requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "IN_PROGRESS"
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_project_status_in_progress_to_done(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Done Prog"}, headers=manager_headers)
        pid = r.json()["id"]
        requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        r2 = requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "DONE"}, headers=manager_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "DONE"
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_project_status_revert_done_to_in_progress(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Revert Prog"}, headers=manager_headers)
        pid = r.json()["id"]
        requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "DONE"}, headers=manager_headers)
        r2 = requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "IN_PROGRESS"
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_member_cannot_change_project_status(self, member_headers, active_project):
        r = requests.patch(f"{BASE}/projects/{active_project['id']}/status",
                           json={"status": "DONE"}, headers=member_headers)
        assert r.status_code == 403

    def test_invalid_status_value_falls_back_gracefully(self, manager_headers, active_project):
        r = requests.patch(f"{BASE}/projects/{active_project['id']}/status",
                           json={"status": "GARBAGE"}, headers=manager_headers)
        assert r.status_code == 200  # fallback: keeps current status

    def test_delete_nonexistent_project_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/projects/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_delete_project_member_forbidden(self, member_headers, active_project):
        r = requests.delete(f"{BASE}/projects/{active_project['id']}", headers=member_headers)
        assert r.status_code == 403

    def test_update_project_name(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "UpdateMe"}, headers=manager_headers)
        pid = r.json()["id"]
        r2 = requests.put(f"{BASE}/projects/{pid}", json={"name": "Updated Name"}, headers=manager_headers)
        assert r2.status_code == 200
        assert r2.json()["name"] == "Updated Name"
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_duplicate_project_name_allowed(self, manager_headers):
        r1 = requests.post(f"{BASE}/projects", json={"name": "DupName"}, headers=manager_headers)
        r2 = requests.post(f"{BASE}/projects", json={"name": "DupName"}, headers=manager_headers)
        assert r1.status_code == 201
        assert r2.status_code == 201
        requests.delete(f"{BASE}/projects/{r1.json()['id']}", headers=manager_headers)
        requests.delete(f"{BASE}/projects/{r2.json()['id']}", headers=manager_headers)
