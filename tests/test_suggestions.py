"""
Task suggestions edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestSuggestions:
    def test_member_can_suggest_task(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "My Suggestion", "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 201
        assert r.json()["status"] == "PENDING"
        assert r.json()["suggestedByName"] is not None

    def test_suggest_missing_title_returns_400(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={"projectId": active_project["id"]}, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_blank_title_returns_400(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={"title": "", "projectId": active_project["id"]}, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_missing_project_returns_400(self, member_headers):
        r = requests.post(f"{BASE}/tasks/suggest", json={"title": "No Proj"}, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_on_done_project_returns_422(self, member_headers, done_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "DONE Sug", "projectId": done_project["id"]
        }, headers=member_headers)
        assert r.status_code == 422

    def test_suggest_title_over_300_chars_returns_400(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "B" * 301, "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 400

    def test_manager_can_get_pending_suggestions(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/pending-approval", headers=manager_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        for t in r.json():
            assert t["status"] == "PENDING"

    def test_member_can_get_own_suggestions(self, member_headers):
        r = requests.get(f"{BASE}/tasks/my-suggestions", headers=member_headers)
        assert r.status_code == 200

    def test_manager_can_approve_suggestion(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Approve This", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "APPROVED"

    def test_approve_already_approved_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Double Approve", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        assert r.status_code == 422

    def test_manager_can_reject_suggestion(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Reject This", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/reject", json={"notes": "Not relevant"}, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "REJECTED"

    def test_reject_already_rejected_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Double Reject", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        assert r.status_code == 422

    def test_member_can_edit_pending_suggestion(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Edit Me", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion", json={"title": "Edited Title"}, headers=member_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "Edited Title"

    def test_edit_suggestion_blank_title_returns_400(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Blank Edit", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion", json={"title": ""}, headers=member_headers)
        assert r.status_code == 400

    def test_cannot_edit_approved_suggestion_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Approved Lock", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion", json={"title": "After Approve"}, headers=member_headers)
        assert r.status_code == 422

    def test_cannot_edit_rejected_suggestion_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Rejected Lock", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion", json={"title": "After Reject"}, headers=member_headers)
        assert r.status_code == 422

    def test_member_cannot_approve_suggestion(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Member Approve", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=member_headers)
        assert r.status_code == 403

    def test_approve_nonexistent_task_returns_404(self, manager_headers):
        r = requests.patch(f"{BASE}/tasks/999999/approve", json={}, headers=manager_headers)
        assert r.status_code == 404
