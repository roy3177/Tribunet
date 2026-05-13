import json
import uuid
from datetime import datetime, timezone

from shared import response
from shared.auth import require_admin
from shared.db import (
    MATCHES_TABLE, STADIUMS_TABLE,
    put_item, get_item, delete_item, scan_with_filter,
)


def main(event, context):
    method    = event['requestContext']['http']['method']
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /matches':
            return _get_matches()
        elif route_key == 'GET /matches/{id}':
            return _get_match(event['pathParameters']['id'])
        elif route_key == 'POST /matches':
            return _create_match(event)
        elif route_key == 'PUT /matches/{id}':
            return _update_match(event, event['pathParameters']['id'])
        elif route_key == 'DELETE /matches/{id}':
            return _delete_match(event, event['pathParameters']['id'])
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[matches] Unhandled error: {e}')
        return response.server_error()


# ── Handlers ──────────────────────────────────────────────────────────────────

def _get_matches():
    items = scan_with_filter(MATCHES_TABLE)
    return response.ok(items)


def _get_match(match_id: str):
    item = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not item:
        return response.not_found('Match')
    return response.ok(item)


def _create_match(event: dict):
    require_admin(event)
    body = json.loads(event.get('body') or '{}')

    stadium_id   = body.get('stadiumId', '')
    stadium_name = _resolve_stadium_name(stadium_id)

    item = {
        'matchId':     str(uuid.uuid4()),
        'homeTeam':    body.get('homeTeam', ''),
        'awayTeam':    body.get('awayTeam', ''),
        'date':        body.get('date', ''),
        'time':        body.get('time', ''),
        'stadiumId':   stadium_id,
        'stadiumName': stadium_name,
        'league':      body.get('league', ''),
        'hasTickets':  bool(body.get('hasTickets', False)),
        'ticketUrl':   body.get('ticketUrl', ''),
        'createdAt':   datetime.now(timezone.utc).isoformat(),
    }
    put_item(MATCHES_TABLE, item)
    return response.created(item)


def _update_match(event: dict, match_id: str):
    require_admin(event)

    existing = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not existing:
        return response.not_found('Match')

    body = json.loads(event.get('body') or '{}')

    # Re-resolve stadium name if stadiumId changed
    stadium_id = body.get('stadiumId', existing.get('stadiumId', ''))
    if stadium_id != existing.get('stadiumId'):
        body['stadiumName'] = _resolve_stadium_name(stadium_id)

    updated = {**existing, **body, 'matchId': match_id}
    put_item(MATCHES_TABLE, updated)
    return response.ok(updated)


def _delete_match(event: dict, match_id: str):
    require_admin(event)

    existing = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not existing:
        return response.not_found('Match')

    delete_item(MATCHES_TABLE, {'matchId': match_id})
    return response.no_content()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_stadium_name(stadium_id: str) -> str:
    if not stadium_id:
        return ''
    stadium = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    return stadium.get('name', '') if stadium else ''
