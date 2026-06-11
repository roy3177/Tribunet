"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/functions/test_favorites.py — Unit Tests for favorites/handler.py
=========================================================================
Tests GET (with match enrichment), POST (add favorite), and DELETE (remove favorite).
DynamoDB is mocked at the resource level since favorites uses get_dynamodb() directly.
"""

import json
import pytest
from unittest.mock import MagicMock
from functions.favorites.handler import main


# Builds a minimal API Gateway event with Cognito JWT claims:
def _ev(method, route_key, path=None, sub='user-123'):
    return {
        'requestContext': {
            'http': {'method': method},
            'authorizer': {'jwt': {'claims': {'sub': sub}}},
        },
        'routeKey': route_key,
        'body': None,
        'pathParameters': path or {},
        'queryStringParameters': {},
    }


# Helper: patches get_dynamodb() to return a mock table with the given query items:
def _mock_dynamo(monkeypatch, query_items=None):
    mock_table = MagicMock()
    mock_table.query.return_value = {'Items': query_items or []}
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_table
    monkeypatch.setattr('functions.favorites.handler.get_dynamodb', lambda: mock_resource)
    return mock_table


# ── GET /favorites ────────────────────────────────────────────────────────────

def test_get_favorites_empty(monkeypatch):
    _mock_dynamo(monkeypatch, query_items=[])
    r = main(_ev('GET', 'GET /favorites'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data'] == []


# Each favorited matchId should be enriched with full match data from Matches table:
def test_get_favorites_enriches_with_match_data(monkeypatch):
    _mock_dynamo(monkeypatch, query_items=[
        {'userId': 'user-123', 'matchId': 'match-1'},
        {'userId': 'user-123', 'matchId': 'match-2'},
    ])
    match_store = {
        'match-1': {'matchId': 'match-1', 'homeTeam': 'A', 'awayTeam': 'B'},
        'match-2': {'matchId': 'match-2', 'homeTeam': 'C', 'awayTeam': 'D'},
    }
    monkeypatch.setattr(
        'functions.favorites.handler.get_item',
        lambda table, key: match_store.get(key['matchId']),
    )
    r = main(_ev('GET', 'GET /favorites'), None)
    assert r['statusCode'] == 200
    data = json.loads(r['body'])['data']
    assert len(data) == 2


# Deleted matches (TTL-expired) should be silently skipped — not cause an error:
def test_get_favorites_skips_deleted_matches(monkeypatch):
    _mock_dynamo(monkeypatch, query_items=[
        {'userId': 'user-123', 'matchId': 'match-1'},
        {'userId': 'user-123', 'matchId': 'match-deleted'},
    ])
    monkeypatch.setattr(
        'functions.favorites.handler.get_item',
        lambda table, key: {'matchId': 'match-1'} if key['matchId'] == 'match-1' else None,
    )
    r = main(_ev('GET', 'GET /favorites'), None)
    data = json.loads(r['body'])['data']
    assert len(data) == 1
    assert data[0]['matchId'] == 'match-1'


# ── POST /favorites/{id} ──────────────────────────────────────────────────────

def test_add_favorite_match_exists(monkeypatch):
    _mock_dynamo(monkeypatch)
    match = {'matchId': 'match-1', 'homeTeam': 'A', 'awayTeam': 'B'}
    monkeypatch.setattr('functions.favorites.handler.get_item', lambda *a, **kw: match)
    monkeypatch.setattr('functions.favorites.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /favorites/{id}', path={'id': 'match-1'}), None)
    assert r['statusCode'] == 201
    data = json.loads(r['body'])['data']
    assert data['matchId'] == 'match-1'
    assert data['userId'] == 'user-123'


# Cannot favorite a match that doesn't exist:
def test_add_favorite_match_not_found(monkeypatch):
    _mock_dynamo(monkeypatch)
    monkeypatch.setattr('functions.favorites.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /favorites/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# Whitespace-only match ID should be rejected:
def test_add_favorite_missing_match_id(monkeypatch):
    _mock_dynamo(monkeypatch)
    r = main(_ev('POST', 'POST /favorites/{id}', path={'id': '   '}), None)
    assert r['statusCode'] == 400


# ── DELETE /favorites/{id} ────────────────────────────────────────────────────

def test_remove_favorite_success(monkeypatch):
    _mock_dynamo(monkeypatch)
    fav = {'userId': 'user-123', 'matchId': 'match-1'}
    monkeypatch.setattr('functions.favorites.handler.get_item', lambda *a, **kw: fav)
    monkeypatch.setattr('functions.favorites.handler.delete_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /favorites/{id}', path={'id': 'match-1'}), None)
    assert r['statusCode'] == 204


# Trying to remove a favorite that doesn't exist should return 404:
def test_remove_favorite_not_found(monkeypatch):
    _mock_dynamo(monkeypatch)
    monkeypatch.setattr('functions.favorites.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /favorites/{id}', path={'id': 'match-1'}), None)
    assert r['statusCode'] == 404
