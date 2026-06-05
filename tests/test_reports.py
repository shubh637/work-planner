"""
Reports endpoint edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestReports:
    def test_tasks_by_status_manager(self, manager_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-status", headers=manager_headers)
        assert r.status_code == 200

    def test_tasks_by_project_manager(self, manager_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-project", headers=manager_headers)
        assert r.status_code == 200

    def test_tasks_by_member_manager(self, manager_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-member", headers=manager_headers)
        assert r.status_code == 200

    def test_reports_denied_for_member(self, member_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-status", headers=member_headers)
        assert r.status_code == 403

    def test_filter_tasks_by_status_open(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "OPEN"}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "OPEN"

    def test_filter_tasks_by_status_closed(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "CLOSED"}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "CLOSED"

    def test_filter_tasks_by_assignee(self, manager_headers, test_member_id):
        r = requests.get(f"{BASE}/tasks", params={"assignedTo": test_member_id}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["assignedToId"] == test_member_id

    def test_filter_tasks_by_project(self, manager_headers, active_project):
        r = requests.get(f"{BASE}/tasks", params={"projectId": active_project["id"]}, headers=manager_headers)
        assert r.status_code == 200
        for t in r.json():
            assert t["projectId"] == active_project["id"]

    def test_filter_by_invalid_status_returns_400(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "INVALID"}, headers=manager_headers)
        assert r.status_code == 400
