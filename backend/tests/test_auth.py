"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/test_auth.py — Unit Tests for shared/auth.py
====================================================
Tests JWT claim extraction (get_claims) and admin role verification (require_admin).
All DynamoDB calls are mocked via monkeypatch — no real AWS connection is made.
"""

import pytest
from unittest.mock import MagicMock
from shared.auth import get_claims, require_admin


# Helper: builds a minimal API Gateway event with the given Cognito sub:
def _ev(sub='user-123'):
    return {
        'requestContext': {
            'authorizer': {'jwt': {'claims': {'sub': sub}}}
        }
    }


# ── get_claims ────────────────────────────────────────────────────────────────

# Happy path — claims are returned correctly from a valid event:
def test_get_claims_returns_claims():
    claims = get_claims(_ev('abc-123'))
    assert claims['sub'] == 'abc-123'


# Missing requestContext entirely — should raise PermissionError:
def test_get_claims_missing_request_context():
    with pytest.raises(PermissionError):
        get_claims({})


# requestContext present but no authorizer — should raise PermissionError:
def test_get_claims_missing_authorizer():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {}})


# authorizer present but no jwt key — should raise PermissionError:
def test_get_claims_missing_jwt():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {'authorizer': {}}})


# jwt present but no claims key — should raise PermissionError:
def test_get_claims_missing_claims():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {'authorizer': {'jwt': {}}}})


# None event (e.g. misconfigured test) — should raise PermissionError not TypeError:
def test_get_claims_none_event():
    with pytest.raises(PermissionError):
        get_claims(None)


# ── require_admin ─────────────────────────────────────────────────────────────

# Admin user in DynamoDB — should pass without raising:
def test_require_admin_passes_for_admin(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'admin'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    require_admin(_ev('user-123'))  # should not raise


# Regular user (role='user') — should raise PermissionError:
def test_require_admin_raises_for_regular_user(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'user'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


# User not found in DynamoDB (no 'Item' key) — should raise PermissionError:
def test_require_admin_raises_when_user_not_in_db(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


# Role with surrounding whitespace — .strip() must catch this:
def test_require_admin_raises_with_whitespace_role(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': '  user  '}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


# require_admin should return the JWT claims on success (used by callers):
def test_require_admin_returns_claims(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'admin'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    claims = require_admin(_ev('user-123'))
    assert claims['sub'] == 'user-123'
