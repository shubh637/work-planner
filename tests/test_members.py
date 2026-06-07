"""
Team member management edge case tests.
"""
import requests
import pytest

BASE = "http://localhost:8080/api"


class TestTeamMembers:
    def test_manager_can_list_all_members(self, manager_headers):
        r = requests.get(f"{BASE}/users", headers=manager_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_member_cannot_list_users(self, member_headers):
        r = requests.get(f"{BASE}/users", headers=member_headers)
        assert r.status_code == 403

    def test_add_member_valid(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "Edge Member", "email": "edgemember@test.com",
            "password": "pass123", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "edgemember@test.com"
        assert data["active"] is True
        # cleanup
        requests.delete(f"{BASE}/users/{data['id']}", headers=manager_headers)

    def test_add_member_duplicate_email_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "Dup", "email": "testmember@test.com",
            "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_member_missing_name_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "email": "noname@test.com", "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_member_missing_email_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "NoEmail", "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_member_invalid_email_format_returns_400(self, manager_headers):
        r = requests.post(f"{BASE}/users", json={
            "name": "BadEmail", "email": "notanemail",
            "password": "x", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 400

    def test_add_member_without_password_sends_invite(self, manager_headers):
        """No-password is valid: backend sends invite email with set-password link."""
        r = requests.post(f"{BASE}/users", json={
            "name": "NoPw", "email": "nopwinvite@test.com", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 201
        assert r.json()["active"] is True
        # cleanup
        requests.delete(f"{BASE}/users/{r.json()['id']}", headers=manager_headers)

    def test_deactivate_member_returns_204(self, manager_headers):
        # create then deactivate
        r = requests.post(f"{BASE}/users", json={
            "name": "ToDeact", "email": "todeact@test.com",
            "password": "pass", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r.status_code == 201
        uid = r.json()["id"]
        r2 = requests.delete(f"{BASE}/users/{uid}", headers=manager_headers)
        assert r2.status_code == 204

    def test_deactivate_nonexistent_member_returns_404(self, manager_headers):
        r = requests.delete(f"{BASE}/users/999999", headers=manager_headers)
        assert r.status_code == 404

    def test_manager_can_update_member(self, manager_headers, test_member_id):
        r = requests.put(f"{BASE}/users/{test_member_id}", json={
            "name": "Test Member", "email": "testmember@test.com"
        }, headers=manager_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "Test Member"

    def test_member_cannot_put_users_endpoint(self, member_headers, test_member_id):
        r = requests.put(f"{BASE}/users/{test_member_id}", json={
            "name": "Hacked", "email": "testmember@test.com"
        }, headers=member_headers)
        assert r.status_code == 403

    def test_update_member_duplicate_email_returns_400(self, manager_headers):
        # create two members, try to set email of one to the other's
        r1 = requests.post(f"{BASE}/users", json={
            "name": "M1", "email": "m1dup@test.com", "password": "p", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        r2 = requests.post(f"{BASE}/users", json={
            "name": "M2", "email": "m2dup@test.com", "password": "p", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        assert r1.status_code == 201
        assert r2.status_code == 201
        id1, id2 = r1.json()["id"], r2.json()["id"]

        # try to set m1's email to m2's
        r = requests.put(f"{BASE}/users/{id1}", json={
            "name": "M1", "email": "m2dup@test.com"
        }, headers=manager_headers)
        assert r.status_code == 400

        requests.delete(f"{BASE}/users/{id1}", headers=manager_headers)
        requests.delete(f"{BASE}/users/{id2}", headers=manager_headers)

    def test_assign_task_to_deactivated_member_blocked(self, manager_headers, active_project):
        # create, deactivate, then try to assign
        r = requests.post(f"{BASE}/users", json={
            "name": "Deact", "email": "deact2@test.com", "password": "p", "role": "TEAM_MEMBER"
        }, headers=manager_headers)
        uid = r.json()["id"]
        requests.delete(f"{BASE}/users/{uid}", headers=manager_headers)

        t = requests.post(f"{BASE}/tasks", json={
            "title": "Assign Deact Test", "projectId": active_project["id"]
        }, headers=manager_headers)
        tid = t.json()["id"]

        r2 = requests.patch(f"{BASE}/tasks/{tid}/assign",
                            json={"assignedToUserId": uid}, headers=manager_headers)
        assert r2.status_code == 403

        requests.delete(f"{BASE}/tasks/{tid}", headers=manager_headers)
