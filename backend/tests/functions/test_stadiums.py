import json
import pytest
from functions.stadiums.handler import _validate_stadium, main


VALID_BODY = {
    'name': 'בלומפילד',
    'city': 'תל אביב',
    'lat':  32.057,
    'lng':  34.768,
}


def _ev(method, route_key, body=None, path=None):
    return {
        'requestContext': {'http': {'method': method}},
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path or {},
        'queryStringParameters': {},
    }


# ── _validate_stadium (pure) ──────────────────────────────────────────────────

def test_validate_stadium_valid():
    assert _validate_stadium(VALID_BODY) is None


def test_validate_stadium_missing_name():
    body = {**VALID_BODY, 'name': ''}
    assert _validate_stadium(body) is not None


def test_validate_stadium_missing_city():
    body = {**VALID_BODY, 'city': ''}
    assert _validate_stadium(body) is not None


def test_validate_stadium_name_too_long():
    body = {**VALID_BODY, 'name': 'א' * 101}
    assert _validate_stadium(body) is not None


def test_validate_stadium_lat_too_high():
    body = {**VALID_BODY, 'lat': 91}
    assert _validate_stadium(body) is not None


def test_validate_stadium_lat_too_low():
    body = {**VALID_BODY, 'lat': -91}
    assert _validate_stadium(body) is not None


def test_validate_stadium_lng_too_high():
    body = {**VALID_BODY, 'lng': 181}
    assert _validate_stadium(body) is not None


def test_validate_stadium_lng_too_low():
    body = {**VALID_BODY, 'lng': -181}
    assert _validate_stadium(body) is not None


@pytest.mark.parametrize('lat', [90, -90, 0])
def test_validate_stadium_lat_boundary_values_accepted(lat):
    body = {**VALID_BODY, 'lat': lat}
    assert _validate_stadium(body) is None


@pytest.mark.parametrize('lng', [180, -180, 0])
def test_validate_stadium_lng_boundary_values_accepted(lng):
    body = {**VALID_BODY, 'lng': lng}
    assert _validate_stadium(body) is None


def test_validate_stadium_non_numeric_lat():
    body = {**VALID_BODY, 'lat': 'not-a-number'}
    assert _validate_stadium(body) is not None


def test_validate_stadium_non_numeric_lng():
    body = {**VALID_BODY, 'lng': 'bad'}
    assert _validate_stadium(body) is not None


def test_validate_stadium_missing_lat():
    body = {**VALID_BODY}
    del body['lat']
    assert _validate_stadium(body) is not None


# ── GET /stadiums ─────────────────────────────────────────────────────────────

def test_get_stadiums_returns_200(monkeypatch):
    items = [{'stadiumId': '1', 'name': 'בלומפילד'}]
    monkeypatch.setattr('functions.stadiums.handler.scan_with_filter', lambda *a, **kw: items)
    r = main(_ev('GET', 'GET /stadiums'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data'] == items


def test_get_stadiums_empty_list(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.scan_with_filter', lambda *a, **kw: [])
    r = main(_ev('GET', 'GET /stadiums'), None)
    assert r['statusCode'] == 200
    assert json.loads(r['body'])['data'] == []


# ── GET /stadiums/{id} ────────────────────────────────────────────────────────

def test_get_stadium_found(monkeypatch):
    item = {'stadiumId': 'abc', 'name': 'טדי'}
    monkeypatch.setattr('functions.stadiums.handler.get_item', lambda *a, **kw: item)
    r = main(_ev('GET', 'GET /stadiums/{id}', path={'id': 'abc'}), None)
    assert r['statusCode'] == 200


def test_get_stadium_not_found(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('GET', 'GET /stadiums/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404


# ── POST /stadiums ────────────────────────────────────────────────────────────

def test_create_stadium_success(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.stadiums.handler.put_item', lambda *a, **kw: None)
    r = main(_ev('POST', 'POST /stadiums', body=VALID_BODY), None)
    assert r['statusCode'] == 201
    data = json.loads(r['body'])['data']
    assert 'stadiumId' in data
    assert data['name'] == VALID_BODY['name']


def test_create_stadium_invalid_body_returns_400(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.require_admin', lambda e: None)
    r = main(_ev('POST', 'POST /stadiums', body={'name': 'Test'}), None)
    assert r['statusCode'] == 400


# ── DELETE /stadiums/{id} ─────────────────────────────────────────────────────

def test_delete_stadium_success(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.stadiums.handler.get_item', lambda *a, **kw: {'stadiumId': 'abc'})
    monkeypatch.setattr('functions.stadiums.handler.delete_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /stadiums/{id}', path={'id': 'abc'}), None)
    assert r['statusCode'] == 204


def test_delete_stadium_not_found(monkeypatch):
    monkeypatch.setattr('functions.stadiums.handler.require_admin', lambda e: None)
    monkeypatch.setattr('functions.stadiums.handler.get_item', lambda *a, **kw: None)
    r = main(_ev('DELETE', 'DELETE /stadiums/{id}', path={'id': 'missing'}), None)
    assert r['statusCode'] == 404
