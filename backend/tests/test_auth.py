import pytest
from unittest.mock import MagicMock
from shared.auth import get_claims, require_admin


def _ev(sub='user-123'):
    return {
        'requestContext': {
            'authorizer': {'jwt': {'claims': {'sub': sub}}}
        }
    }


# ── get_claims ────────────────────────────────────────────────────────────────

def test_get_claims_returns_claims():
    claims = get_claims(_ev('abc-123'))
    assert claims['sub'] == 'abc-123'


def test_get_claims_missing_request_context():
    with pytest.raises(PermissionError):
        get_claims({})


def test_get_claims_missing_authorizer():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {}})


def test_get_claims_missing_jwt():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {'authorizer': {}}})


def test_get_claims_missing_claims():
    with pytest.raises(PermissionError):
        get_claims({'requestContext': {'authorizer': {'jwt': {}}}})


def test_get_claims_none_event():
    with pytest.raises(PermissionError):
        get_claims(None)


# ── require_admin ─────────────────────────────────────────────────────────────

def test_require_admin_passes_for_admin(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'admin'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    # Should not raise
    require_admin(_ev('user-123'))


def test_require_admin_raises_for_regular_user(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'user'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


def test_require_admin_raises_when_user_not_in_db(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {}  # no 'Item' key
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


def test_require_admin_raises_with_whitespace_role(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': '  user  '}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    with pytest.raises(PermissionError):
        require_admin(_ev('user-123'))


def test_require_admin_returns_claims(monkeypatch):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': {'userId': 'user-123', 'role': 'admin'}}
    monkeypatch.setattr('shared.auth._users_table', lambda: mock_table)
    claims = require_admin(_ev('user-123'))
    assert claims['sub'] == 'user-123'
