import json
from decimal import Decimal
from shared import response


def _body(r):
    return json.loads(r['body'])


# ── Status codes ──────────────────────────────────────────────────────────────

def test_ok_with_data():
    r = response.ok({'key': 'value'})
    assert r['statusCode'] == 200
    assert _body(r)['data'] == {'key': 'value'}


def test_ok_no_data():
    r = response.ok()
    assert r['statusCode'] == 200
    assert _body(r) == {}


def test_ok_with_message():
    r = response.ok(message='done')
    assert r['statusCode'] == 200
    assert _body(r)['message'] == 'done'


def test_created():
    r = response.created({'id': '1'})
    assert r['statusCode'] == 201
    assert _body(r)['data'] == {'id': '1'}


def test_created_no_data():
    r = response.created()
    assert r['statusCode'] == 201


def test_no_content():
    r = response.no_content()
    assert r['statusCode'] == 204


def test_bad_request():
    r = response.bad_request('Missing field')
    assert r['statusCode'] == 400
    assert 'Missing field' in _body(r)['error']


def test_bad_request_default():
    r = response.bad_request()
    assert r['statusCode'] == 400


def test_not_found():
    r = response.not_found('Stadium')
    assert r['statusCode'] == 404
    assert 'Stadium' in _body(r)['error']


def test_forbidden():
    r = response.forbidden('No access')
    assert r['statusCode'] == 403
    assert _body(r)['error'] == 'No access'


def test_unauthorized():
    r = response.unauthorized()
    assert r['statusCode'] == 401


def test_server_error():
    r = response.server_error()
    assert r['statusCode'] == 500


def test_options_preflight():
    r = response.options_preflight()
    assert r['statusCode'] == 200


# ── CORS headers ──────────────────────────────────────────────────────────────

def test_cors_header_present_on_ok():
    r = response.ok()
    assert 'Access-Control-Allow-Origin' in r['headers']


def test_cors_methods_header_present():
    r = response.ok()
    assert 'Access-Control-Allow-Methods' in r['headers']


def test_cors_header_present_on_error():
    r = response.bad_request()
    assert 'Access-Control-Allow-Origin' in r['headers']


# ── Decimal encoding ──────────────────────────────────────────────────────────

def test_decimal_whole_number_encodes_as_int():
    r = response.ok({'val': Decimal('5')})
    assert _body(r)['data']['val'] == 5
    assert isinstance(_body(r)['data']['val'], int)


def test_decimal_fraction_encodes_as_float():
    r = response.ok({'val': Decimal('5.5')})
    assert _body(r)['data']['val'] == 5.5
    assert isinstance(_body(r)['data']['val'], float)


def test_decimal_zero_encodes_as_int():
    r = response.ok({'val': Decimal('0')})
    assert _body(r)['data']['val'] == 0
