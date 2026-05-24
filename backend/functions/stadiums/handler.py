import json
import uuid
from decimal import Decimal, InvalidOperation
from datetime import datetime, timezone

from shared import response
from shared.auth import require_admin
from shared.db import (
    STADIUMS_TABLE,
    put_item, get_item, delete_item, scan_with_filter,
)

def _validate_stadium(body: dict) -> str | None:
    if not body.get('name', '').strip():
        return 'Missing required field: name'
    if not body.get('city', '').strip():
        return 'Missing required field: city'
    if len(body.get('name', '')) > 100:
        return 'name too long'
    try:
        lat = float(body.get('lat', ''))
        if not (-90 <= lat <= 90):
            return 'lat must be between -90 and 90'
    except (ValueError, TypeError):
        return 'lat must be a valid number'
    try:
        lng = float(body.get('lng', ''))
        if not (-180 <= lng <= 180):
            return 'lng must be between -180 and 180'
    except (ValueError, TypeError):
        return 'lng must be a valid number'
    return None


def main(event, context):
    method    = event['requestContext']['http']['method']
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /stadiums':
            return _get_stadiums()
        elif route_key == 'GET /stadiums/{id}':
            return _get_stadium(event['pathParameters']['id'])
        elif route_key == 'POST /stadiums':
            return _create_stadium(event)
        elif route_key == 'PUT /stadiums/{id}':
            return _update_stadium(event, event['pathParameters']['id'])
        elif route_key == 'DELETE /stadiums/{id}':
            return _delete_stadium(event, event['pathParameters']['id'])
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[stadiums] Unhandled error: {e}')
        return response.server_error()


def _get_stadiums():
    items = scan_with_filter(STADIUMS_TABLE)
    return response.ok(items)


def _get_stadium(stadium_id: str):
    item = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    if not item:
        return response.not_found('Stadium')
    return response.ok(item)


def _create_stadium(event: dict):
    require_admin(event)
    body = json.loads(event.get('body') or '{}')

    error = _validate_stadium(body)
    if error:
        return response.bad_request(error)

    item = {
        'stadiumId': str(uuid.uuid4()),
        'name':      body['name'].strip(),
        'city':      body['city'].strip(),
        'lat':       Decimal(str(body['lat'])),
        'lng':       Decimal(str(body['lng'])),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    put_item(STADIUMS_TABLE, item)
    return response.created(item)


def _update_stadium(event: dict, stadium_id: str):
    require_admin(event)

    existing = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    if not existing:
        return response.not_found('Stadium')

    body    = json.loads(event.get('body') or '{}')
    merged  = {**existing, **body}

    error = _validate_stadium(merged)
    if error:
        return response.bad_request(error)

    merged['stadiumId'] = stadium_id
    if 'lat' in body:
        merged['lat'] = Decimal(str(body['lat']))
    if 'lng' in body:
        merged['lng'] = Decimal(str(body['lng']))

    put_item(STADIUMS_TABLE, merged)
    return response.ok(merged)


def _delete_stadium(event: dict, stadium_id: str):
    require_admin(event)

    existing = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    if not existing:
        return response.not_found('Stadium')

    delete_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    return response.no_content()