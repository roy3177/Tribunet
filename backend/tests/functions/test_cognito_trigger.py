import pytest
from unittest.mock import MagicMock
from functions.cognito_trigger.handler import main


def _cognito_event(trigger, sub='user-sub-123', email='test@example.com', name=None):
    attrs = {'sub': sub, 'email': email}
    if name is not None:
        attrs['name'] = name
    return {
        'triggerSource': trigger,
        'request': {'userAttributes': attrs},
    }


def _mock_table(monkeypatch, existing_item=None):
    mock_table = MagicMock()
    mock_table.get_item.return_value = {'Item': existing_item} if existing_item else {}
    mock_dynamo = MagicMock()
    mock_dynamo.Table.return_value = mock_table
    monkeypatch.setattr('functions.cognito_trigger.handler.dynamodb', mock_dynamo)
    return mock_table


# ── PostConfirmation (sign-up) ────────────────────────────────────────────────

def test_confirm_signup_calls_put_item(monkeypatch):
    table = _mock_table(monkeypatch)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', name='Roy')
    result = main(event, None)
    table.put_item.assert_called_once()


def test_confirm_signup_stores_correct_fields(monkeypatch):
    stored = {}
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = lambda Item: stored.update(Item)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', sub='sub-1', email='a@b.com', name='Roy')
    main(event, None)
    assert stored['userId'] == 'sub-1'
    assert stored['email'] == 'a@b.com'
    assert stored['name'] == 'Roy'
    assert stored['role'] == 'user'


def test_confirm_signup_name_defaults_to_email_prefix(monkeypatch):
    stored = {}
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = lambda Item: stored.update(Item)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', email='johndoe@example.com')
    main(event, None)
    assert stored['name'] == 'johndoe'


def test_confirm_signup_returns_event_unchanged(monkeypatch):
    _mock_table(monkeypatch)
    event = _cognito_event('PostConfirmation_ConfirmSignUp')
    result = main(event, None)
    assert result is event


# ── PostAuthentication (login) ────────────────────────────────────────────────

def test_login_skips_put_item_if_user_exists(monkeypatch):
    existing = {'userId': 'sub-1', 'email': 'test@example.com', 'role': 'user'}
    table = _mock_table(monkeypatch, existing_item=existing)
    event = _cognito_event('PostAuthentication_Authentication', sub='sub-1')
    main(event, None)
    table.put_item.assert_not_called()


def test_login_creates_user_if_not_in_db(monkeypatch):
    table = _mock_table(monkeypatch, existing_item=None)
    event = _cognito_event('PostAuthentication_Authentication', sub='sub-new')
    main(event, None)
    table.put_item.assert_called_once()


def test_login_returns_event_unchanged(monkeypatch):
    _mock_table(monkeypatch, existing_item={'userId': 'sub-1'})
    event = _cognito_event('PostAuthentication_Authentication', sub='sub-1')
    result = main(event, None)
    assert result is event


# ── Unhandled triggers ────────────────────────────────────────────────────────

def test_unhandled_trigger_skips_put_item(monkeypatch):
    table = _mock_table(monkeypatch)
    event = _cognito_event('PreAuthentication_Authentication')
    main(event, None)
    table.put_item.assert_not_called()


def test_unhandled_trigger_returns_event(monkeypatch):
    _mock_table(monkeypatch)
    event = _cognito_event('TokenGeneration_HostedAuth')
    result = main(event, None)
    assert result is event


# ── Error handling ────────────────────────────────────────────────────────────

def test_dynamodb_error_does_not_raise(monkeypatch):
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = Exception('DynamoDB connection refused')
    event = _cognito_event('PostConfirmation_ConfirmSignUp')
    result = main(event, None)
    assert result is event
