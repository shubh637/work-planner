"""
Member task progress edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


@pytest.fixture
def assigned_task(manager_headers, active_project, test_member_id):
    """Create a fresh OPEN task assigned to test member, yield it, then delete."""
    t = requests.post(f"{BASE}/tasks", json={
        "title": "Progress Test Task", "projectId": active_project["id"],
        "assignedToUserId": test_member_id
    }, headers=manager_headers)
    assert t.status_code == 201
    task = t.json()
    yield task
    requests.delete(f"{BASE}/tasks/{task['id']}", headers=manager_headers)


class TestMemberProgress:
    def test_member_can_post_update(self, member_headers, assigned_task):
        r = requests.post(f"{BASE}/tasks/{assigned_task['id']}/update",
                          json={"notes": "Working on it"}, headers=member_headers)
        assert r.status_code == 200

    def test_member_advances_open_to_in_progress(self, member_headers, assigned_task):
        r = requests.patch(f"{BASE}/tasks/{assigned_task['id']}/progress",
                           json={}, headers=member_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "IN_PROGRESS"

    def test_member_advances_in_progress_to_closed(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "Advance Closed", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "CLOSED"
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_member_cannot_advance_closed_task_returns_422(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "Already Closed", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        assert r.status_code == 422
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_member_can_mark_complete(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "Complete Me", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/complete",
                           json={"notes": "Done!"}, headers=member_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "CLOSED"
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_complete_already_closed_returns_422(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "Already Completed", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/tasks/{tid}/complete", json={}, headers=member_headers)
        r = requests.patch(f"{BASE}/tasks/{tid}/complete", json={}, headers=member_headers)
        assert r.status_code == 422
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_wrong_member_cannot_post_update(self, manager_headers, active_project, test_member_id):
        # Create second member
        m2 = requests.post(f"{BASE}/users", json={
            "name": "M2", "email": "m2prog@test.com", "password": "pass", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        m2_id = m2.json()["id"]
        m2_token = requests.post(f"{BASE}/auth/login", json={
            "email": "m2prog@test.com", "password": "pass"
        }).json()["token"]
        m2_headers = {"Authorization": f"Bearer {m2_token}"}

        # Task assigned to test_member_id, not m2
        t = requests.post(f"{BASE}/tasks", json={
            "title": "WrongMember", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]

        r = requests.post(f"{BASE}/tasks/{tid}/update", json={"notes": "Not my task"}, headers=m2_headers)
        assert r.status_code == 403

        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        requests.delete(f"{BASE}/users/{m2_id}", headers=manager_headers)

    def test_wrong_member_cannot_advance_task(self, manager_headers, active_project, test_member_id):
        m2 = requests.post(f"{BASE}/users", json={
            "name": "M3", "email": "m3prog@test.com", "password": "pass", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        m2_id = m2.json()["id"]
        m2_token = requests.post(f"{BASE}/auth/login", json={
            "email": "m3prog@test.com", "password": "pass"
        }).json()["token"]
        m2_headers = {"Authorization": f"Bearer {m2_token}"}

        t = requests.post(f"{BASE}/tasks", json={
            "title": "WrongAdvance", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]

        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=m2_headers)
        assert r.status_code == 403

        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        requests.delete(f"{BASE}/users/{m2_id}", headers=manager_headers)

    def test_unassigned_member_cannot_post_update(self, member_headers, manager_headers, active_project):
        # Task not assigned to anyone
        t = requests.post(f"{BASE}/tasks", json={
            "title": "Unassigned Task", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.post(f"{BASE}/tasks/{tid}/update", json={"notes": "Sneaky"}, headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)


class TestTaskHistory:
    def test_task_history_returns_list(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "HistTask", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.get(f"{BASE}/tasks/{tid}/history", headers=manager_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1  # at least the creation event
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_task_history_member_can_view(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "MemberHist", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.get(f"{BASE}/tasks/{tid}/history", headers=member_headers)
        assert r.status_code == 200
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_task_history_nonexistent_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/999999/history", headers=manager_headers)
        assert r.status_code == 404

    def test_history_records_status_change(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "StatusHist", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        requests.put(f"{BASE}/tasks/{tid}", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        r = requests.get(f"{BASE}/tasks/{tid}/history", headers=manager_headers)
        statuses = [h["newStatus"] for h in r.json()]
        assert "IN_PROGRESS" in statuses
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
