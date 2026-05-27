import json
import pytest
from unittest.mock import MagicMock
from functions.users.handler import main


def _ev(method, route_key, body=None, path=None, sub='user-123'):
    return {
        'requestContext': {
            'http': {'method': method},
            'authorizer': {'jwt': {'claims': {'sub': sub}}},
        },
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path or {},
        'queryStringParameters': {},
    }


# ── GET /users/me ─────────────────────────────────────────────────────────────

def test_get_me_returns_user(monkeypatch):
    user = {'userId': 'user-123', 'email': 'test@example.com', 'role': 'user'}
    monkeypatch.setattr('functions.users.handler.get_item', lambda *a, **kw: user)
    r = main(_ev('GET', 'GET /users/me'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['userId'] == 'user-123'


def test_get_me_not_found(monkeypatch):
    monkeypatch.setattr('functions.users.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('GET', 'GET /users/me'), None)
    assert r['statusCode'] == 404


# ── PUT /users/me ─────────────────────────────────────────────────────────────

def test_update_me_valid_name(monkeypatch):
    existing = {'userId': 'user-123', 'name': 'Old Name', 'role': 'user'}
    monkeypatch.setattr('functions.users.handler.get_item', lambda *a, **kw: existing)
    monkeypatch.setattr('functions.users.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('PUT', 'PUT /users/me', body={'name': 'New Name'}), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['name'] == 'New Name'


def test_update_me_empty_name_returns_400(monkeypatch):
    r = main(_ev('PUT', 'PUT /users/me', body={'name': ''}), None)
    assert r['statusCode'] == 400


def test_update_me_whitespace_name_returns_400(monkeypatch):
    r = main(_ev('PUT', 'PUT /users/me', body={'name': '   '}), None)
    assert r['statusCode'] == 400


def test_update_me_name_too_long_returns_400(monkeypatch):
    r = main(_ev('PUT', 'PUT /users/me', body={'name': 'א' * 101}), None)
    assert r['statusCode'] == 400


def test_update_me_user_not_found(monkeypatch):
    monkeypatch.setattr('functions.users.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('PUT', 'PUT /users/me', body={'name': 'Valid Name'}), None)
    assert r['statusCode'] == 404


# ── GET /users (admin) ────────────────────────────────────────────────────────

def test_get_users_returns_list(monkeypatch):
    users = [{'userId': '1'}, {'userId': '2'}]
    monkeypatch.setattr('functions.users.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.users.handler.scan_with_filter', lambda *a, **kw: users)
    r = main(_ev('GET', 'GET /users'), None)
    assert r['statusCode'] == 200
    assert len(json.loads(r['body'])['data']) == 2


# ── DELETE /users/{id} (admin) ────────────────────────────────────────────────

def test_delete_user_success(monkeypatch):
    class FakeUserNotFound(Exception):
        pass

    mock_cognito = MagicMock()
    mock_cognito.exceptions.UserNotFoundException = FakeUserNotFound
    mock_cognito.admin_delete_user.return_value = {}

    monkeypatch.setattr('functions.users.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.users.handler.get_cognito', lambda: mock_cognito)
    monkeypatch.setattr('functions.users.handler.delete_item', lambda *a, **kw: None)

    r = main(_ev('DELETE', 'DELETE /users/{id}', path={'id': 'user-999'}), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['deleted'] == 'user-999'


def test_delete_user_cognito_not_found_still_succeeds(monkeypatch):
    class FakeUserNotFound(Exception):
        pass

    mock_cognito = MagicMock()
    mock_cognito.exceptions.UserNotFoundException = FakeUserNotFound
    mock_cognito.admin_delete_user.side_effect = FakeUserNotFound('Not found in pool')

    monkeypatch.setattr('functions.users.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.users.handler.get_cognito', lambda: mock_cognito)
    monkeypatch.setattr('functions.users.handler.delete_item', lambda *a, **kw: None)

    r = main(_ev('DELETE', 'DELETE /users/{id}', path={'id': 'user-999'}), None)
    assert r['statusCode'] == 200


def test_delete_user_missing_id_returns_400(monkeypatch):
    monkeypatch.setattr('functions.users.handler.require_admin', lambda e: None)
    r = main(_ev('DELETE', 'DELETE /users/{id}', path={'id': ''}), None)
    assert r['statusCode'] == 400
