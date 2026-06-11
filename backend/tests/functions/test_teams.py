"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/functions/test_teams.py — Unit Tests for teams/handler.py
================================================================
Tests team listing (alphabetical sort), CRUD endpoints, and that
teamId is never overwritten on update. Mocked via monkeypatch.
"""

import json
import pytest
from functions.teams.handler import main


# Builds a minimal API Gateway event:
def _ev(method, route_key, body=None, path=None):
    return {
        'requestContext': {'http': {'method': method}},
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path or {},
        'queryStringParameters': {},
    }


# ── GET /teams ────────────────────────────────────────────────────────────────

# Teams must be returned sorted alphabetically by name:
def test_get_teams_sorted_by_name_ascending(monkeypatch):
    items = [
        {'teamId': '1', 'name': 'מכבי חיפה'},
        {'teamId': '2', 'name': 'הפועל תל אביב'},
        {'teamId': '3', 'name': 'בית"ר ירושלים'},
    ]
    monkeypatch.setattr('functions.teams.handler.scan_with_filter', lambda *a, **kw: items)
    r = main(_ev('GET', 'GET /teams'), None)
    assert r['statusCode'] == 200
    data = json.loads(r['body'])['data']
    names = [t['name'] for t in data]
    assert names == sorted(names)


def test_get_teams_empty(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.scan_with_filter', lambda *a, **kw: [])
    r = main(_ev('GET', 'GET /teams'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data'] == []


# ── GET /teams/{id} ───────────────────────────────────────────────────────────

def test_get_team_found(monkeypatch):
    item = {'teamId': 'tm1', 'name': 'מכבי תל אביב'}
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: item)
    r = main(_ev('GET', 'GET /teams/{id}', path={'id': 'tm1'}), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data']['teamId'] == 'tm1'


def test_get_team_not_found(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('GET', 'GET /teams/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── POST /teams ───────────────────────────────────────────────────────────────

# When no fields are provided, all string fields should default to '':
def test_create_team_with_defaults(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    stored = {}
    monkeypatch.setattr('functions.teams.handler.put_item', lambda t, item: stored.update(item))
    r = main(_ev('POST', 'POST /teams', body={}), None)
    assert r['statusCode'] == 201
    assert stored['name'] == ''
    assert stored['league'] == ''
    assert stored['city'] == ''


def test_create_team_with_data(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.teams.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /teams', body={'name': 'מכבי תל אביב', 'city': 'תל אביב'}), None)
    assert r['statusCode'] == 201
    data = json.loads(r['body'])['data']
    assert data['name'] == 'מכבי תל אביב'
    assert 'teamId' in data


# ── PUT /teams/{id} ───────────────────────────────────────────────────────────

# teamId must never change after creation — the path param always wins:
def test_update_team_preserves_team_id(monkeypatch):
    existing = {'teamId': 'tm1', 'name': 'Old Name', 'league': '', 'city': ''}
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: existing)
    stored = {}
    monkeypatch.setattr('functions.teams.handler.put_item', lambda t, item: stored.update(item))
    r = main(_ev('PUT', 'PUT /teams/{id}', body={'name': 'New Name'}, path={'id': 'tm1'}), None)
    assert r['statusCode'] == 200
    assert stored['teamId'] == 'tm1'
    assert stored['name'] == 'New Name'


def test_update_team_not_found(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('PUT', 'PUT /teams/{id}', body={'name': 'X'}, path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── DELETE /teams/{id} ────────────────────────────────────────────────────────

def test_delete_team_success(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: {'teamId': 'tm1'})
    monkeypatch.setattr('functions.teams.handler.delete_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /teams/{id}', path={'id': 'tm1'}), None)
    assert r['statusCode'] == 204


def test_delete_team_not_found(monkeypatch):
    monkeypatch.setattr('functions.teams.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.teams.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /teams/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404
