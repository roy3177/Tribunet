import os
import json
from decimal import Decimal


class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _build(status_code: int, body: dict | list | None = None) -> dict:
    import os
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


def ok(data=None, message: str | None = None) -> dict:
    body = {}
    if data is not None:
        body['data'] = data
    if message:
        body['message'] = message
    return _build(200, body)


def created(data=None) -> dict:
    return _build(201, {'data': data} if data is not None else {})


def no_content() -> dict:
    return _build(204)


def bad_request(message: str = 'Bad request') -> dict:
    return _build(400, {'error': message})


def unauthorized(message: str = 'Unauthorized') -> dict:
    return _build(401, {'error': message})


def forbidden(message: str = 'Forbidden') -> dict:
    return _build(403, {'error': message})


def not_found(resource: str = 'Resource') -> dict:
    return _build(404, {'error': f'{resource} not found'})


def server_error(message: str = 'Internal server error') -> dict:
    return _build(500, {'error': message})


def options_preflight() -> dict:
    """Response for CORS preflight OPTIONS requests."""
    return _build(200, {})
