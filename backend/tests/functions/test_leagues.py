"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/functions/test_leagues.py — Unit Tests for leagues/handler.py
=====================================================================
Tests league listing (sorted by level), CRUD endpoints, and default field values.
DynamoDB and admin auth are mocked via monkeypatch — no real AWS calls.
"""

import json
import pytest
from functions.leagues.handler import main


# Builds a minimal API Gateway event:
def _ev(method, route_key, body=None, path=None):
    return {
        'requestContext': {'http': {'method': method}},
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path or {},
        'queryStringParameters': {},
    }


# ── GET /leagues ──────────────────────────────────────────────────────────────

# Leagues must be returned sorted by level ascending (1 = top flight):
def test_get_leagues_sorted_by_level_ascending(monkeypatch):
    items = [
        {'leagueId': '1', 'name': 'ליגה לאומית', 'level': 2},
        {'leagueId': '2', 'name': 'ליגת העל',    'level': 1},
        {'leagueId': '3', 'name': 'ליגה ג',       'level': 3},
    ]
    monkeypatch.setattr('functions.leagues.handler.scan_with_filter', lambda *a, **kw: items)
    r = main(_ev('GET', 'GET /leagues'), None)
    assert r['statusCode'] == 200
    data = json.loads(r['body'])['data']
    levels = [item['level'] for item in data]
    assert levels == sorted(levels)


# Leagues without a 'level' key should default to 99 and appear last:
def test_get_leagues_item_without_level_sorts_last(monkeypatch):
    items = [
        {'leagueId': '1', 'name': 'ליגת העל', 'level': 1},
        {'leagueId': '2', 'name': 'ללא רמה'},  # no 'level' key → defaults to 99
    ]
    monkeypatch.setattr('functions.leagues.handler.scan_with_filter', lambda *a, **kw: items)
    r = main(_ev('GET', 'GET /leagues'), None)
    data = json.loads(r['body'])['data']
    assert data[0]['leagueId'] == '1'
    assert data[1]['leagueId'] == '2'


def test_get_leagues_empty(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.scan_with_filter', lambda *a, **kw: [])
    r = main(_ev('GET', 'GET /leagues'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data'] == []


# ── GET /leagues/{id} ─────────────────────────────────────────────────────────

def test_get_league_found(monkeypatch):
    item = {'leagueId': 'lg1', 'name': 'ליגת העל', 'level': 1}
    monkeypatch.setattr('functions.leagues.handler.get_item', lambda *a, **kw: item)
    r = main(_ev('GET', 'GET /leagues/{id}', path={'id': 'lg1'}), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['leagueId'] == 'lg1'


def test_get_league_not_found(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('GET', 'GET /leagues/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── POST /leagues ─────────────────────────────────────────────────────────────

# When level/type are not provided, defaults must be applied (level=1, type='league'):
def test_create_league_has_default_level_and_type(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.require_admin', lambda e: None)
    stored = {}
    def fake_put(table, item):
        stored.update(item)
    monkeypatch.setattr('functions.leagues.handler.put_item', fake_put)
    r = main(_ev('POST', 'POST /leagues', body={'name': 'ליגת העל'}), None)
    assert r['statusCode'] == 201
    assert stored['level'] == 1
    assert stored['type'] == 'league'


def test_create_league_custom_level(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.require_admin', lambda e: None)
    stored = {}
    monkeypatch.setattr('functions.leagues.handler.put_item', lambda t, item: stored.update(item))
    r = main(_ev('POST', 'POST /leagues', body={'name': 'ליגה ב', 'level': 2}), None)
    assert r['statusCode'] == 201
    assert stored['level'] == 2


# A new league must always be assigned a unique leagueId:
def test_create_league_has_league_id(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.leagues.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /leagues', body={'name': 'ליגת העל'}), None)
    data = json.loads(r['body'])['data']
    assert 'leagueId' in data


# ── DELETE /leagues/{id} ──────────────────────────────────────────────────────

def test_delete_league_success(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.leagues.handler.get_item', lambda *a, **kw: {'leagueId': 'lg1'})
    monkeypatch.setattr('functions.leagues.handler.delete_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /leagues/{id}', path={'id': 'lg1'}), None)
    assert r['statusCode'] == 204


def test_delete_league_not_found(monkeypatch):
    monkeypatch.setattr('functions.leagues.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.leagues.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /leagues/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404
