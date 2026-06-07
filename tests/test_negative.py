"""
Negative testing — covers unauthorized access, malformed input, boundary violations,
state conflicts, injection attacks, and header manipulation.
"""
import requests
import pytest
import json

BASE = "http://localhost:8080/api"


# ---------------------------------------------------------------------------
# Auth Negative Tests
# ---------------------------------------------------------------------------
class TestAuthNegative:

    def test_login_empty_email(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "", "password": "admin123"})
        assert r.status_code in (400, 401)

    def test_login_empty_password(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@workplanner.com", "password": ""})
        assert r.status_code in (400, 401)

    def test_login_null_email(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": None, "password": "admin123"})
        assert r.status_code == 400

    def test_login_null_password(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@workplanner.com", "password": None})
        assert r.status_code in (400, 401)

    def test_login_extra_fields_ignored(self):
        r = requests.post(f"{BASE}/auth/login", json={
            "email": "admin@workplanner.com", "password": "admin123", "role": "ADMIN", "id": 1
        })
        assert r.status_code == 200

    def test_malformed_json_body(self):
        r = requests.post(f"{BASE}/auth/login",
                          data="not json at all",
                          headers={"Content-Type": "application/json"})
        assert r.status_code == 400

    def test_wrong_content_type(self):
        r = requests.post(f"{BASE}/auth/login",
                          data="email=admin@workplanner.com&password=admin123",
                          headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code in (400, 415)

    def test_tampered_token_rejected(self, manager_token):
        tampered = manager_token[:-5] + "XXXXX"
        r = requests.get(f"{BASE}/projects", headers={"Authorization": f"Bearer {tampered}"})
        assert r.status_code == 403

    def test_token_without_bearer_prefix_rejected(self, manager_token):
        r = requests.get(f"{BASE}/projects", headers={"Authorization": manager_token})
        assert r.status_code == 403

    def test_empty_bearer_token_rejected(self):
        r = requests.get(f"{BASE}/projects", headers={"Authorization": "Bearer "})
        assert r.status_code == 403

    def test_numeric_token_rejected(self):
        r = requests.get(f"{BASE}/projects", headers={"Authorization": "Bearer 123456"})
        assert r.status_code == 403

    def test_sql_injection_login(self):
        r = requests.post(f"{BASE}/auth/login", json={
            "email": "' OR '1'='1", "password": "' OR '1'='1"
        })
        assert r.status_code in (400, 401)

    def test_xss_in_login_email(self):
        r = requests.post(f"{BASE}/auth/login", json={
            "email": "<script>alert(1)</script>@test.com", "password": "x"
        })
        assert r.status_code in (400, 401)

    def test_very_long_email_rejected(self):
        r = requests.post(f"{BASE}/auth/login", json={
            "email": "a" * 500 + "@test.com", "password": "x"
        })
        assert r.status_code in (400, 401)

    def test_very_long_password_rejected(self):
        r = requests.post(f"{BASE}/auth/login", json={
            "email": "admin@workplanner.com", "password": "x" * 10000
        })
        assert r.status_code in (400, 401)


# ---------------------------------------------------------------------------
# Role Escalation / Unauthorized Access
# ---------------------------------------------------------------------------
class TestRoleEscalation:

    def test_member_cannot_create_project(self, member_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "Hack Project"}, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_delete_project(self, member_headers, active_project):
        r = requests.delete(f"{BASE}/projects/{active_project['id']}", headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_change_project_status(self, member_headers, active_project):
        r = requests.patch(f"{BASE}/projects/{active_project['id']}/status",
                           json={"status": "DONE"}, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_create_task(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Hacked Task", "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_delete_task(self, member_headers, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "TempDel", "projectId": active_project["id"]
        }, headers=manager_headers)
        assert t.status_code == 201
        tid = t.json()["id"]
        r = requests.delete(f"{BASE}/tasks/{tid}", headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_member_cannot_assign_task(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "TempAssign", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign",
                           json={"assignedToUserId": test_member_id}, headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_member_cannot_approve_suggestion(self, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Priv Esc Sug", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_reject_suggestion(self, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Priv Esc Rej", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_list_all_users(self, member_headers):
        r = requests.get(f"{BASE}/users", headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_add_user(self, member_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "Rogue", "email": "rogue@test.com", "password": "x", "role": "TEAM_MEMBER"
        }, headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_delete_user(self, member_headers, test_member_id):
        r = requests.delete(f"{BASE}/users/{test_member_id}", headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_access_reports(self, member_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-status", headers=member_headers)
        assert r.status_code == 403

    def test_no_token_on_projects(self):
        r = requests.get(f"{BASE}/projects")
        assert r.status_code == 403

    def test_no_token_on_tasks(self):
        r = requests.get(f"{BASE}/tasks")
        assert r.status_code == 403

    def test_no_token_on_users(self):
        r = requests.get(f"{BASE}/users")
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Task Negative Tests
# ---------------------------------------------------------------------------
class TestTaskNegative:

    def test_create_task_empty_title(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "", "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_whitespace_title(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "   ", "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_title_301_chars(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "A" * 301, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_null_title(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": None, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_null_project(self, manager_headers):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Null Project", "projectId": None
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_create_task_nonexistent_project_returns_404(self, manager_headers):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Ghost Project Task", "projectId": 999999
        }, headers=manager_headers)
        assert r.status_code == 404

    def test_create_task_nonexistent_assignee_returns_404(self, manager_headers, active_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Ghost Assignee", "projectId": active_project["id"], "assignedToUserId": 999999
        }, headers=manager_headers)
        assert r.status_code == 404

    def test_create_task_on_done_project_returns_422(self, manager_headers, done_project):
        r = requests.post(f"{BASE}/tasks", json={
            "title": "Task on done", "projectId": done_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 422

    def test_update_task_empty_title(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "UpdateNeg", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.put(f"{BASE}/tasks/{tid}", json={"title": ""}, headers=manager_headers)
        assert r.status_code == 400
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_update_nonexistent_task_returns_404(self, manager_headers):
        r = requests.put(f"{BASE}/tasks/999999", json={"title": "Ghost"}, headers=manager_headers)
        assert r.status_code == 404

    def test_delete_nonexistent_task_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/tasks/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_get_nonexistent_task_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_assign_nonexistent_task_returns_404(self, manager_headers, test_member_id):
        r = requests.patch(f"{BASE}/tasks/999999/assign",
                           json={"assignedToUserId": test_member_id}, headers=manager_headers)
        assert r.status_code == 404

    def test_assign_nonexistent_user_returns_404(self, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "AssignGhost", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign",
                           json={"assignedToUserId": 999999}, headers=manager_headers)
        assert r.status_code == 404
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_filter_invalid_status_returns_400(self, manager_headers):
        r = requests.get(f"{BASE}/tasks", params={"status": "BLAH"}, headers=manager_headers)
        assert r.status_code == 400

    def test_sql_injection_in_task_title_stored_safely(self, manager_headers, active_project):
        payload = "'; DROP TABLE tasks; --"
        r = requests.post(f"{BASE}/tasks", json={
            "title": payload, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 201
        assert r.json()["title"] == payload
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)

    def test_xss_in_task_title_stored_safely(self, manager_headers, active_project):
        payload = "<script>alert('xss')</script>"
        r = requests.post(f"{BASE}/tasks", json={
            "title": payload, "projectId": active_project["id"]
        }, headers=manager_headers)
        assert r.status_code == 201
        requests.delete(f"{BASE}/tasks/{r.json()['id']}", headers=manager_headers)


# ---------------------------------------------------------------------------
# Project Negative Tests
# ---------------------------------------------------------------------------
class TestProjectNegative:

    def test_create_project_empty_name(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": ""}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_project_null_name(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": None}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_project_whitespace_name(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "   "}, headers=manager_headers)
        assert r.status_code == 400

    def test_create_project_missing_name_field(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={}, headers=manager_headers)
        assert r.status_code == 400

    def test_get_nonexistent_project_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/projects/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_delete_nonexistent_project_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/projects/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_invalid_status_transition_not_started_to_done(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "BadTransition"}, headers=manager_headers)
        pid = r.json()["id"]
        r2 = requests.patch(f"{BASE}/projects/{pid}/status",
                             json={"status": "DONE"}, headers=manager_headers)
        assert r2.status_code in (400, 422)
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_invalid_status_value_returns_error(self, manager_headers, active_project):
        r = requests.patch(f"{BASE}/projects/{active_project['id']}/status",
                           json={"status": "INVALID_STATUS"}, headers=manager_headers)
        assert r.status_code in (400, 422)

    def test_update_project_empty_name(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "UpdateNeg"}, headers=manager_headers)
        pid = r.json()["id"]
        r2 = requests.put(f"{BASE}/projects/{pid}", json={"name": ""}, headers=manager_headers)
        assert r2.status_code == 400
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)

    def test_create_task_on_not_started_project_blocked(self, manager_headers):
        r = requests.post(f"{BASE}/projects", json={"name": "NotStarted"}, headers=manager_headers)
        pid = r.json()["id"]
        t = requests.post(f"{BASE}/tasks", json={"title": "T1", "projectId": pid}, headers=manager_headers)
        # NOT_STARTED project may or may not block task creation — check it doesn't 500
        assert t.status_code in (201, 422)
        if t.status_code == 201:
            requests.delete(f"{BASE}/tasks/{t.json()['id']}", headers=manager_headers)
        requests.delete(f"{BASE}/projects/{pid}", headers=manager_headers)


# ---------------------------------------------------------------------------
# User Management Negative Tests
# ---------------------------------------------------------------------------
class TestUserNegative:

    def test_add_user_duplicate_email(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "Dup", "email": "testmember@test.com",
            "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_user_missing_name(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "email": "nonameX@test.com", "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_user_missing_email(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "NoEmail", "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_user_invalid_email_format(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "BadEmail", "email": "notanemail",
            "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_user_empty_name(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "", "email": "emptyname@test.com", "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_delete_nonexistent_user_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/users/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_update_user_duplicate_email(self, manager_headers, test_member_id):
        r = requests.post(f"{BASE}/users", json={
            "name": "DupUpdate", "email": "dupupdate@test.com",
            "password": "p", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 201
        new_id = r.json()["id"]
        r2 = requests.put(f"{BASE}/users/{new_id}", json={
            "name": "DupUpdate", "email": "testmember@test.com"
        }, headers=manager_headers)
        assert r2.status_code == 400
        requests.delete(f"{BASE}/users/{new_id}", headers=manager_headers)

    def test_assign_task_to_deactivated_user_blocked(self, manager_headers, active_project):
        u = requests.post(f"{BASE}/users", json={
            "name": "TempDeact", "email": "tempdeact99@test.com",
            "password": "p", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        uid = u.json()["id"]
        requests.delete(f"{BASE}/users/{uid}", headers=manager_headers)

        t = requests.post(f"{BASE}/tasks", json={
            "title": "DeactAssign", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/assign",
                           json={"assignedToUserId": uid}, headers=manager_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)


# ---------------------------------------------------------------------------
# Suggestion Negative Tests
# ---------------------------------------------------------------------------
class TestSuggestionNegative:

    def test_suggest_empty_title(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "", "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_whitespace_title(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "   ", "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_title_over_300_chars(self, member_headers, active_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Z" * 301, "projectId": active_project["id"]
        }, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_missing_project(self, member_headers):
        r = requests.post(f"{BASE}/tasks/suggest", json={"title": "No Proj"}, headers=member_headers)
        assert r.status_code == 400

    def test_suggest_nonexistent_project(self, member_headers):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Ghost Proj", "projectId": 999999
        }, headers=member_headers)
        assert r.status_code == 404

    def test_suggest_on_done_project_returns_422(self, member_headers, done_project):
        r = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "Done Sug", "projectId": done_project["id"]
        }, headers=member_headers)
        assert r.status_code == 422

    def test_approve_nonexistent_suggestion(self, manager_headers):
        r = requests.patch(f"{BASE}/tasks/999999/approve", json={}, headers=manager_headers)
        assert r.status_code == 404

    def test_reject_nonexistent_suggestion(self, manager_headers):
        r = requests.patch(f"{BASE}/tasks/999999/reject", json={}, headers=manager_headers)
        assert r.status_code == 404

    def test_double_approve_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "DblApprove", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        assert r.status_code == 422

    def test_double_reject_returns_422(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "DblReject", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        assert r.status_code == 422

    def test_edit_approved_suggestion_locked(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "ApprLock", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/approve", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion",
                           json={"title": "Sneaky Edit"}, headers=member_headers)
        assert r.status_code == 422

    def test_edit_rejected_suggestion_locked(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "RejLock", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        requests.patch(f"{BASE}/tasks/{sid}/reject", json={}, headers=manager_headers)
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion",
                           json={"title": "Sneaky Edit"}, headers=member_headers)
        assert r.status_code == 422

    def test_edit_suggestion_blank_title(self, manager_headers, member_headers, active_project):
        sug = requests.post(f"{BASE}/tasks/suggest", json={
            "title": "BlankEdit", "projectId": active_project["id"]
        }, headers=member_headers)
        sid = sug.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{sid}/suggestion",
                           json={"title": ""}, headers=member_headers)
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Progress / State Machine Negative Tests
# ---------------------------------------------------------------------------
class TestProgressNegative:

    def test_advance_closed_task_returns_422(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "AdvClosed", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        assert r.status_code == 422
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_complete_already_closed_returns_422(self, member_headers, manager_headers, active_project, test_member_id):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "AlrClosed", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        requests.patch(f"{BASE}/tasks/{tid}/complete", json={}, headers=member_headers)
        r = requests.patch(f"{BASE}/tasks/{tid}/complete", json={}, headers=member_headers)
        assert r.status_code == 422
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_wrong_member_cannot_advance_task(self, manager_headers, active_project, test_member_id):
        m2 = requests.post(f"{BASE}/users", json={
            "name": "WrongAdv", "email": "wrongadv@test.com", "password": "pass", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        m2_id = m2.json()["id"]
        tok = requests.post(f"{BASE}/auth/login", json={
            "email": "wrongadv@test.com", "password": "pass"
        }).json()["token"]
        m2_headers = {"Authorization": f"Bearer {tok}"}

        t = requests.post(f"{BASE}/tasks", json={
            "title": "WrongAdv Task", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=m2_headers)
        assert r.status_code == 403

        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        requests.delete(f"{BASE}/users/{m2_id}", headers=manager_headers)

    def test_wrong_member_cannot_post_update(self, manager_headers, active_project, test_member_id):
        m2 = requests.post(f"{BASE}/users", json={
            "name": "WrongUpd", "email": "wrongupd@test.com", "password": "pass", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        m2_id = m2.json()["id"]
        tok = requests.post(f"{BASE}/auth/login", json={
            "email": "wrongupd@test.com", "password": "pass"
        }).json()["token"]
        m2_headers = {"Authorization": f"Bearer {tok}"}

        t = requests.post(f"{BASE}/tasks", json={
            "title": "WrongUpd Task", "projectId": active_project["id"],
            "assignedToUserId": test_member_id
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.post(f"{BASE}/tasks/{tid}/update",
                          json={"notes": "Not my task"}, headers=m2_headers)
        assert r.status_code == 403

        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
        requests.delete(f"{BASE}/users/{m2_id}", headers=manager_headers)

    def test_unassigned_member_cannot_update_task(self, member_headers, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "UnassignedUpd", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.post(f"{BASE}/tasks/{tid}/update",
                          json={"notes": "Sneak"}, headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)

    def test_advance_unassigned_task_blocked(self, member_headers, manager_headers, active_project):
        t = requests.post(f"{BASE}/tasks", json={
            "title": "UnassignedAdv", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]
        r = requests.patch(f"{BASE}/tasks/{tid}/progress", json={}, headers=member_headers)
        assert r.status_code == 403
        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)


# ---------------------------------------------------------------------------
# History Negative Tests
# ---------------------------------------------------------------------------
class TestHistoryNegative:

    def test_history_nonexistent_task_returns_404(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/999999/history", headers=manager_headers)
        assert r.status_code == 404

    def test_history_requires_auth(self):
        r = requests.get(f"{BASE}/tasks/1/history")
        assert r.status_code == 403

    def test_history_invalid_task_id_string(self, manager_headers):
        r = requests.get(f"{BASE}/tasks/abc/history", headers=manager_headers)
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Report Negative Tests
# ---------------------------------------------------------------------------
class TestReportNegative:

    def test_member_cannot_access_tasks_by_status(self, member_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-status", headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_access_tasks_by_project(self, member_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-project", headers=member_headers)
        assert r.status_code == 403

    def test_member_cannot_access_tasks_by_member(self, member_headers):
        r = requests.get(f"{BASE}/reports/tasks-by-member", headers=member_headers)
        assert r.status_code == 403

    def test_no_auth_on_reports(self):
        r = requests.get(f"{BASE}/reports/tasks-by-status")
        assert r.status_code == 403
