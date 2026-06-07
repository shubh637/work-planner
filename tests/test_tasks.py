"""
Task CRUD and assignment edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestTaskCreation:
    def test_create_task_valid_unassigned(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Valid Task", "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 201
        assert r.json()["status"] == "OPEN"
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)

    def test_create_task_with_assignment(self, manager_headers, active_project, test_member_id):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Assigned Task", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        assert r.status_code == 201
        assert r.json()["assignedToId"] == test_member_id
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)

    def test_create_task_missing_title_returns_400(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={"projectId": active_project["id"]}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_blank_title_returns_400(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={"title": "   ", "projectId": active_project["id"]}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_missing_project_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/tasks", json={"title": "No Project"}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_nonexistent_project_returns_404(self, manager_headers):
        r = requests.post(f"{BASE}/tasks", json={"title": "Ghost Proj", "projectId": 999999}, headers=manager_headers)
        assert r.status_code == 404

    def test_create_task_on_done_project_returns_422(self, manager_headers, done_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "DONE Task", "projectId": done_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 422

    def test_create_task_title_over_300_chars_returns_400(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "A" * 301, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_title_exactly_300_chars_allowed(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "A" * 300, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 201
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)

    def test_create_task_sql_injection_stored_safely(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Robert'); DROP TABLE tasks;--", "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 201
        assert "DROP" in r.json()["title"]
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)

    def test_member_cannot_create_task(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Sneaky", "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 403


class TestTaskRetrieval:
    def test_get_all_tasks_manager(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", headers=manager_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_member_cannot_get_all_tasks(self, member_headers):
        r = requests.get(f"{BASE}/tasks", headers=member_headers)
        assert r.status_code == 403

    def test_get_task_by_id_manager(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "GetById", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.get(f"{BASE}/tasks/{tid}", headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["id"] == tid
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_get_nonexistent_task_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_filter_by_status(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "OPEN"}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "OPEN"

    def test_filter_by_invalid_status_returns_400(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "BLAH"}, headers=manager_headers)
        assert r.status_code == 400

    def test_filter_by_project(self, manager_headers, active_project):
        r = requests.get(f"{BASE}/tasks", params={"projectId": active_project["id"]}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["projectId"] == active_project["id"]

    def test_member_get_my_tasks(self, member_headers):
        r = requests.get(f"{BASE}/tasks/my", headers=member_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_task_history_nonexistent_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/999999/history", headers=manager_headers)
        assert r.status_code == 404


class TestTaskAssignment:
    def test_assign_task_to_member(self, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={"title": "Assign Me", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign", json={"assignedToUserId": test_member_id}, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["assignedToId"] == test_member_id
        assert r.json()["status"] == "OPEN"
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_assign_task_nonexistent_user_returns_404(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "BadAssign", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign", json={"assignedToUserId": 999999}, headers=manager_headers)
        assert r.status_code == 404
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_assign_task_in_done_project_returns_422(self, manager_headers, done_project, test_member_id):
        # Create task while project was still active (via direct approach)
        # Re-create a task via a workaround: temporarily activate project then mark done
        r = requests.post(f"{BASE}/projects", json={"name": "TempDoneAssign"}, headers=manager_headers)
        pid = r.json()["id"]
        t = requests.post(f"{BASE}/tasks", json={"title": "Pre-done Task", "projectId": pid}, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        requests.patch(f"{BASE}/projects/{pid}/status", json={"status": "DONE"}, headers=manager_headers)
        r2 = requests.patch(f"{BASE}/tasks/{tid}/assign", json={"assignedToUserId": test_member_id}, headers=manager_headers)
        assert r2.status_code == 422
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_member_cannot_assign_task(self, member_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={"title": "MemberAssign", "projectId": active_project["id"]}, headers=member_headers)
        assert t.status_code == 403

    def test_assign_task_missing_userid_returns_400(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "NoUserId", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign", json={}, headers=manager_headers)
        assert r.status_code == 400
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)


class TestTaskUpdate:
    def test_manager_can_update_task_title(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "Old Title", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.put(f"{BASE}/tasks/{tid}", json={"title": "New Title"}, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "New Title"
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_manager_can_update_task_status(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "StatusTask", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.put(f"{BASE}/tasks/{tid}", json={"status": "IN_PROGRESS"}, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "IN_PROGRESS"
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_member_cannot_put_task(self, member_headers, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "MemberPut", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.put(f"{BASE}/tasks/{tid}", json={"title": "Hacked"}, headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_delete_task_returns_204(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={"title": "DeleteMe", "projectId": active_project["id"]}, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        assert r.status_code == 204

    def test_delete_nonexistent_task_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/tasks/999999", headers=manager_headers)
        assert r.status_code == 404
