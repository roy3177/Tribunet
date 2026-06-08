""""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

response.py — Shared API Response Helpers
==========================================
This module provides standardized HTTP response builders for all Lambda functions.
Every response includes CORS headers and serializes Decimal types (used by DynamoDB)
into JSON-safe integers or floats.

Usage:
    from shared.response import ok, not_found, bad_request
    return ok(data={"id": "123"})

"""

import os
import json
from decimal import Decimal

# DynamoDB returns Decimal types for numbers — JSON doesn't support them natively.
# This encoder converts Decimal to int (if whole) or float.
class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

# Internal helper that builds the full Lambda response dict with CORS headers.
# FRONTEND_URL env var controls which origin is allowed (defaults to '*' in dev).
def _build(status_code: int, body: dict | list | None = None) -> dict:
    headers = {
        'Access-Control-Allow-Origin':  os.environ.get('FRONTEND_URL', '*'),
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json',
    }
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body or {}, cls=_DecimalEncoder),
    }

# 200 OK — returns data and/or a success message:
def ok(data=None, message: str | None = None) -> dict:
    body = {}
    if data is not None:
        body['data'] = data
    if message:
        body['message'] = message
    return _build(200, body)

# 201 Created — returned after successfully creating a new resource:
def created(data=None) -> dict:
    return _build(201, {'data': data} if data is not None else {})

# 204 No Content — returned after a successful DELETE with nothing to return:
def no_content() -> dict:
    return _build(204)

# 400 Bad Request — missing or invalid input from the client:
def bad_request(message: str = 'Bad request') -> dict:
    return _build(400, {'error': message})

# 401 Unauthorized — no valid JWT token provided:
def unauthorized(message: str = 'Unauthorized') -> dict:
    return _build(401, {'error': message})

# 403 Forbidden — token is valid but the user lacks the required role (e.g. not admin):
def forbidden(message: str = 'Forbidden') -> dict:
    return _build(403, {'error': message})

# 404 Not Found — the requested resource doesn't exist in DynamoDB:
def not_found(resource: str = 'Resource') -> dict:
    return _build(404, {'error': f'{resource} not found'})

# 500 Internal Server Error — unexpected exception in the Lambda handler:
def server_error(message: str = 'Internal server error') -> dict:
    return _build(500, {'error': message})

# Response for CORS preflight OPTIONS requests:
def options_preflight() -> dict:
    return _build(200, {})
