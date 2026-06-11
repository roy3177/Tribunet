"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/functions/test_scheduler.py — Unit Tests for scheduler/handler.py
=========================================================================
Tests match grouping by date window (this week / next week),
the low-match warning threshold, SNS publish behavior, and return value.
Both DynamoDB and SNS are mocked via monkeypatch on module-level attributes.
"""

import pytest
from unittest.mock import MagicMock
from datetime import date


# Helper: builds a minimal match dict with a given date:
def _make_match(match_date):
    return {'matchId': 'x', 'homeTeam': 'A', 'awayTeam': 'B', 'date': match_date}


# autouse=True ensures DynamoDB and SNS are patched before every test in this file:
@pytest.fixture(autouse=True)
def mock_aws(monkeypatch):
    import functions.scheduler.handler as handler
    mock_table = MagicMock()
    mock_dynamo = MagicMock()
    mock_dynamo.Table.return_value = mock_table
    mock_sns = MagicMock()
    monkeypatch.setattr(handler, '_dynamo', mock_dynamo)
    monkeypatch.setattr(handler, '_sns', mock_sns)
    return mock_table, mock_sns


# ── Date grouping ─────────────────────────────────────────────────────────────

# Matches from today through +7 days should appear in "this week":
def test_this_week_matches_counted(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-28'),  # tomorrow (+1 day)
        _make_match('2026-06-03'),  # exactly +7 days
        _make_match('2026-06-10'),  # +14 days → next week
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    call_args = handler._sns.publish.call_args[1]
    assert 'משחקים השבוע' in call_args['Message']


# Past matches (before today) must not be counted in "this week":
def test_past_matches_not_counted_in_this_week(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-26'),  # yesterday
        _make_match('2026-05-25'),  # 2 days ago
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'משחקים השבוע (2026-05-27 עד 2026-06-03): 0' in msg


# Matches +8 to +14 days out should appear in "next week":
def test_next_week_matches_counted(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-06-05'),  # +9 days → next week
        _make_match('2026-06-10'),  # +14 days → next week
        _make_match('2026-06-11'),  # +15 days → beyond scope
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'משחקים שבוע הבא: 2' in msg


# ── Warning threshold ─────────────────────────────────────────────────────────

# Fewer than 5 total active matches → warning message must appear in the report:
def test_warning_message_when_fewer_than_5_matches(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-28'),
        _make_match('2026-05-29'),
        _make_match('2026-05-30'),  # only 3 total
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'פחות מ-5 משחקים' in msg


# 5 or more matches → no warning:
def test_no_warning_when_5_or_more_matches(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-28'),
        _make_match('2026-05-29'),
        _make_match('2026-05-30'),
        _make_match('2026-05-31'),
        _make_match('2026-06-01'),
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'פחות מ-5 משחקים' not in msg


# ── Return value ──────────────────────────────────────────────────────────────

# main() must return the total match count and a 'ok' status:
def test_returns_total_count(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-28'),
        _make_match('2026-05-29'),
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    result = handler.main({}, None)
    assert result['total'] == 2
    assert result['status'] == 'ok'


# ── SNS publish ───────────────────────────────────────────────────────────────

# SNS must be called exactly once per scheduler run:
def test_sns_publish_called_once(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': []}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    handler._sns.publish.assert_called_once()


# The correct SNS topic ARN (from env var) must be used:
def test_sns_publish_uses_correct_topic(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': []}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    call_kwargs = handler._sns.publish.call_args[1]
    assert call_kwargs['TopicArn'] == 'arn:aws:sns:us-east-1:123456789012:test-topic'
