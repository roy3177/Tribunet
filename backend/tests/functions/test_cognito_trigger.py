"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/functions/test_cognito_trigger.py — Unit Tests for cognito_trigger/handler.py
=====================================================================================
Tests that the Cognito trigger correctly creates DynamoDB user records on signup,
skips existing users on login, handles unrecognized triggers gracefully,
and never raises an exception (which would block the user from signing in).
"""

import pytest
from unittest.mock import MagicMock
from functions.cognito_trigger.handler import main


# Builds a Cognito trigger event with the given trigger source and user attributes:
def _cognito_event(trigger, sub='user-sub-123', email='test@example.com', name=None):
    attrs = {'sub': sub, 'email': email}
    if name is not None:
        attrs['name'] = name
    return {
        'triggerSource': trigger,
        'request': {'userAttributes': attrs},
    }


# Helper: patches the module-level dynamodb resource with a mock table:
def _mock_table(monkeypatch, existing_item=None):
    mock_table = MagicMock()
    # Simulate get_item returning an existing user or an empty response:
    mock_table.get_item.return_value = {'Item': existing_item} if existing_item else {}
    mock_dynamo = MagicMock()
    mock_dynamo.Table.return_value = mock_table
    monkeypatch.setattr('functions.cognito_trigger.handler.dynamodb', mock_dynamo)
    return mock_table


# ── PostConfirmation (sign-up) ────────────────────────────────────────────────

# A new user confirming their email must be saved to DynamoDB:
def test_confirm_signup_calls_put_item(monkeypatch):
    table = _mock_table(monkeypatch)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', name='Roy')
    result = main(event, None)
    table.put_item.assert_called_once()


# Verify all required fields are stored with correct values:
def test_confirm_signup_stores_correct_fields(monkeypatch):
    stored = {}
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = lambda Item: stored.update(Item)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', sub='sub-1', email='a@b.com', name='Roy')
    main(event, None)
    assert stored['userId'] == 'sub-1'
    assert stored['email'] == 'a@b.com'
    assert stored['name'] == 'Roy'
    assert stored['role'] == 'user'  # all new users start as 'user'


# When Cognito doesn't provide a name, the email prefix (before @) is used as fallback:
def test_confirm_signup_name_defaults_to_email_prefix(monkeypatch):
    stored = {}
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = lambda Item: stored.update(Item)
    event = _cognito_event('PostConfirmation_ConfirmSignUp', email='johndoe@example.com')
    main(event, None)
    assert stored['name'] == 'johndoe'


# Cognito requires the original event to be returned unchanged:
def test_confirm_signup_returns_event_unchanged(monkeypatch):
    _mock_table(monkeypatch)
    event = _cognito_event('PostConfirmation_ConfirmSignUp')
    result = main(event, None)
    assert result is event


# ── PostAuthentication (login) ────────────────────────────────────────────────

# If the user already exists in DynamoDB, don't overwrite their data (especially role):
def test_login_skips_put_item_if_user_exists(monkeypatch):
    existing = {'userId': 'sub-1', 'email': 'test@example.com', 'role': 'user'}
    table = _mock_table(monkeypatch, existing_item=existing)
    event = _cognito_event('PostAuthentication_Authentication', sub='sub-1')
    main(event, None)
    table.put_item.assert_not_called()


# If user is not in DynamoDB (e.g. trigger failed at signup), create them on login:
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

# Triggers we don't handle (e.g. PreAuthentication) must be silently ignored:
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

# A DynamoDB error must be swallowed — raising would block the user from signing in:
def test_dynamodb_error_does_not_raise(monkeypatch):
    table = _mock_table(monkeypatch)
    table.put_item.side_effect = Exception('DynamoDB connection refused')
    event = _cognito_event('PostConfirmation_ConfirmSignUp')
    result = main(event, None)
    assert result is event
