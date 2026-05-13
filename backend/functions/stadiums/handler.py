import json
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from shared import response
from shared.auth import require_admin
from shared.db import (
    STADIUMS_TABLE,
    put_item, get_item, delete_item, scan_with_filter,
)


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


# ── Handlers ──────────────────────────────────────────────────────────────────

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

    item = {
        'stadiumId': str(uuid.uuid4()),
        'name':      body.get('name', ''),
        'city':      body.get('city', ''),
        'lat':       Decimal(str(body.get('lat', 0))),
        'lng':       Decimal(str(body.get('lng', 0))),
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
    updated = {**existing, **body, 'stadiumId': stadium_id}

    if 'lat' in body:
        updated['lat'] = Decimal(str(body['lat']))
    if 'lng' in body:
        updated['lng'] = Decimal(str(body['lng']))

    put_item(STADIUMS_TABLE, updated)
    return response.ok(updated)


def _delete_stadium(event: dict, stadium_id: str):
    require_admin(event)

    existing = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    if not existing:
        return response.not_found('Stadium')

    delete_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    return response.no_content()
