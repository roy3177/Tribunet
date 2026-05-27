import json
import base64
import pytest
from datetime import datetime, timezone
from functions.matches.handler import _validate_match, _compute_ttl, main

# ── Helpers ───────────────────────────────────────────────────────────────────

VALID_BODY = {
    'homeTeam':  'מכבי תל אביב',
    'awayTeam':  'הפועל באר שבע',
    'date':      '2026-06-01',
    'time':      '20:00',
    'stadiumId': 'stadium-1',
    'league':    'ליגת העל',
}


def _ev(method, route_key, body=None, path=None, qs=None):
    return {
        'requestContext': {'http': {'method': method}},
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path or {},
        'queryStringParameters': qs or {},
    }


# ── _validate_match (pure) ────────────────────────────────────────────────────

def test_validate_match_valid():
    assert _validate_match(VALID_BODY) is None


@pytest.mark.parametrize('field', ['homeTeam', 'awayTeam', 'date', 'time', 'stadiumId', 'league'])
def test_validate_match_missing_required_field(field):
    body = {**VALID_BODY, field: ''}
    assert _validate_match(body) is not None


def test_validate_match_bad_date_format():
    body = {**VALID_BODY, 'date': '2026/06/01'}
    assert _validate_match(body) is not None


def test_validate_match_same_teams():
    body = {**VALID_BODY, 'awayTeam': VALID_BODY['homeTeam']}
    assert _validate_match(body) is not None


def test_validate_match_home_team_too_long():
    body = {**VALID_BODY, 'homeTeam': 'א' * 101}
    assert _validate_match(body) is not None


def test_validate_match_away_team_too_long():
    body = {**VALID_BODY, 'awayTeam': 'ב' * 101}
    assert _validate_match(body) is not None


def test_validate_match_bad_ticket_url():
    body = {**VALID_BODY, 'ticketUrl': 'ftp://not-http.com'}
    assert _validate_match(body) is not None


def test_validate_match_empty_ticket_url_ok():
    body = {**VALID_BODY, 'ticketUrl': ''}
    assert _validate_match(body) is None


def test_validate_match_valid_https_url():
    body = {**VALID_BODY, 'ticketUrl': 'https://example.com'}
    assert _validate_match(body) is None


# ── _compute_ttl (pure) ───────────────────────────────────────────────────────

def test_compute_ttl_is_start_of_next_day():
    ttl = _compute_ttl('2026-06-01')
    expected = int(datetime(2026, 6, 2, tzinfo=timezone.utc).timestamp())
    assert ttl == expected


def test_compute_ttl_empty_string_returns_zero():
    assert _compute_ttl('') == 0


# ── GET /matches ──────────────────────────────────────────────────────────────

def test_get_matches_returns_200_with_list(monkeypatch):
    monkeypatch.setattr(
        'functions.matches.handler.scan_page',
        lambda *a, **kw: {'items': [{'matchId': '1', 'homeTeam': 'A', 'awayTeam': 'B'}], 'lastKey': None},
    )
    r = main(_ev('GET', 'GET /matches'), None)
    assert r['statusCode'] == 200
    data = json.loads(r['body'])['data']
    assert isinstance(data['matches'], list)
    assert data['count'] == 1


def test_get_matches_next_key_none_when_last_page(monkeypatch):
    monkeypatch.setattr(
        'functions.matches.handler.scan_page',
        lambda *a, **kw: {'items': [], 'lastKey': None},
    )
    r = main(_ev('GET', 'GET /matches'), None)
    assert json.loads(r['body'])['data']['nextKey'] is None


def test_get_matches_bad_cursor_returns_400(monkeypatch):
    monkeypatch.setattr(
        'functions.matches.handler.scan_page',
        lambda *a, **kw: {'items': [], 'lastKey': None},
    )
    bad_cursor = base64.b64encode(b'not-valid-json!!!').decode()
    r = main(_ev('GET', 'GET /matches', qs={'lastKey': bad_cursor}), None)
    # Decoded value is not valid JSON → bad_request
    # Use a cursor that decodes to non-JSON
    r2 = main(_ev('GET', 'GET /matches', qs={'lastKey': 'AAAA'}), None)
    assert r2['statusCode'] == 400


# ── GET /matches/{id} ─────────────────────────────────────────────────────────

def test_get_match_found(monkeypatch):
    item = {'matchId': 'abc', 'homeTeam': 'X', 'awayTeam': 'Y'}
    monkeypatch.setattr('functions.matches.handler.get_item', lambda *a, **kw: item)
    r = main(_ev('GET', 'GET /matches/{id}', path={'id': 'abc'}), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['matchId'] == 'abc'


def test_get_match_not_found(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('GET', 'GET /matches/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── POST /matches ─────────────────────────────────────────────────────────────

def test_create_match_success(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.require_admin', lambda e: None)
    monkeypatch.setattr(
        'functions.matches.handler.get_item',
        lambda table, key: {'stadiumId': 'stadium-1', 'name': 'בלומפילד'} if 'STADIUM' in table else None,
    )
    monkeypatch.setattr('functions.matches.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /matches', body=VALID_BODY), None)
    assert r['statusCode'] == 201
    data = json.loads(r['body'])['data']
    assert 'matchId' in data
    assert data['homeTeam'] == VALID_BODY['homeTeam']


def test_create_match_invalid_body_returns_400(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.require_admin', lambda e: None)
    r = main(_ev('POST', 'POST /matches', body={'homeTeam': 'Only Home'}), None)
    assert r['statusCode'] == 400


def test_create_match_stadium_not_found_returns_400(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.matches.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /matches', body=VALID_BODY), None)
    assert r['statusCode'] == 400
    assert 'Stadium' in json.loads(r['body'])['error']


def test_create_match_admin_required(monkeypatch):
    monkeypatch.setattr(
        'functions.matches.handler.require_admin',
        lambda e: (_ for _ in ()).throw(PermissionError('Admin access required')),
    )
    r = main(_ev('POST', 'POST /matches', body=VALID_BODY), None)
    assert r['statusCode'] == 403


# ── DELETE /matches/{id} ──────────────────────────────────────────────────────

def test_delete_match_success(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.matches.handler.get_item', lambda *a, **kw: {'matchId': 'abc'})
    monkeypatch.setattr('functions.matches.handler.delete_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /matches/{id}', path={'id': 'abc'}), None)
    assert r['statusCode'] == 204


def test_delete_match_not_found(monkeypatch):
    monkeypatch.setattr('functions.matches.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.matches.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /matches/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── OPTIONS preflight ─────────────────────────────────────────────────────────

def test_options_returns_200():
    r = main(_ev('OPTIONS', ''), None)
    assert r['statusCode'] == 200
