import pytest
from unittest.mock import MagicMock
from datetime import date


def _make_match(match_date):
    return {'matchId': 'x', 'homeTeam': 'A', 'awayTeam': 'B', 'date': match_date}


@pytest.fixture(autouse=True)
def mock_aws(monkeypatch):
    """Patch module-level _dynamo and _sns before each test."""
    import functions.scheduler.handler as handler
    mock_table = MagicMock()
    mock_dynamo = MagicMock()
    mock_dynamo.Table.return_value = mock_table
    mock_sns = MagicMock()
    monkeypatch.setattr(handler, '_dynamo', mock_dynamo)
    monkeypatch.setattr(handler, '_sns', mock_sns)
    return mock_table, mock_sns


def _run(monkeypatch, matches, today=date(2026, 5, 27)):
    """Helper: set up mocks, run main(), return result."""
    import functions.scheduler.handler as handler
    mock_table, mock_sns = mock_aws.__wrapped__ if hasattr(mock_aws, '__wrapped__') else (None, None)

    # Get the already-patched objects from the fixture via the handler module
    handler._dynamo.Table.return_value.scan.return_value = {'Items': matches}

    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = today
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    return handler.main({}, None)


# ── Date grouping ─────────────────────────────────────────────────────────────

def test_this_week_matches_counted(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-28'),  # tomorrow
        _make_match('2026-06-03'),  # exactly 7 days out
        _make_match('2026-06-10'),  # 14 days out → next week
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    call_args = handler._sns.publish.call_args[1]
    assert 'משחקים השבוע' in call_args['Message']


def test_past_matches_not_counted_in_this_week(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-05-26'),  # yesterday
        _make_match('2026-05-25'),  # 2 days ago
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    result = handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'משחקים השבוע (2026-05-27 עד 2026-06-03): 0' in msg


def test_next_week_matches_counted(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': [
        _make_match('2026-06-05'),  # 8 days out → next week
        _make_match('2026-06-10'),  # 14 days out → next week
        _make_match('2026-06-11'),  # 15 days out → beyond
    ]}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    msg = handler._sns.publish.call_args[1]['Message']
    assert 'משחקים שבוע הבא: 2' in msg


# ── Warning threshold ─────────────────────────────────────────────────────────

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

def test_sns_publish_called_once(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': []}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    handler._sns.publish.assert_called_once()


def test_sns_publish_uses_correct_topic(monkeypatch):
    import functions.scheduler.handler as handler
    handler._dynamo.Table.return_value.scan.return_value = {'Items': []}
    mock_dt = MagicMock()
    mock_dt.now.return_value.date.return_value = date(2026, 5, 27)
    monkeypatch.setattr(handler, 'datetime', mock_dt)

    handler.main({}, None)
    call_kwargs = handler._sns.publish.call_args[1]
    assert call_kwargs['TopicArn'] == 'arn:aws:sns:us-east-1:123456789012:test-topic'
