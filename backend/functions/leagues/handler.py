import json
import uuid
from datetime import datetime, timezone

from shared import response
from shared.auth import require_admin
from shared.db import LEAGUES_TABLE, put_item, get_item, delete_item, scan_with_filter


def main(event, context):
    method    = event['requestContext']['http']['method']
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /leagues':
            return _get_leagues()
        elif route_key == 'GET /leagues/{id}':
            return _get_league(event['pathParameters']['id'])
        elif route_key == 'POST /leagues':
            return _create_league(event)
        elif route_key == 'PUT /leagues/{id}':
            return _update_league(event, event['pathParameters']['id'])
        elif route_key == 'DELETE /leagues/{id}':
            return _delete_league(event, event['pathParameters']['id'])
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[leagues] Unhandled error: {e}')
        return response.server_error()


def _get_leagues():
    items = scan_with_filter(LEAGUES_TABLE)
    return response.ok(sorted(items, key=lambda x: x.get('level', 99)))


def _get_league(league_id: str):
    item = get_item(LEAGUES_TABLE, {'leagueId': league_id})
    if not item:
        return response.not_found('League')
    return response.ok(item)


def _create_league(event: dict):
    require_admin(event)
    body = json.loads(event.get('body') or '{}')
    item = {
        'leagueId':  str(uuid.uuid4()),
        'name':      body.get('name', ''),
        'level':     body.get('level', 1),
        'type':      body.get('type', 'league'),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    put_item(LEAGUES_TABLE, item)
    return response.created(item)


def _update_league(event: dict, league_id: str):
    require_admin(event)
    existing = get_item(LEAGUES_TABLE, {'leagueId': league_id})
    if not existing:
        return response.not_found('League')
    body    = json.loads(event.get('body') or '{}')
    updated = {**existing, **body, 'leagueId': league_id}
    put_item(LEAGUES_TABLE, updated)
    return response.ok(updated)


def _delete_league(event: dict, league_id: str):
    require_admin(event)
    existing = get_item(LEAGUES_TABLE, {'leagueId': league_id})
    if not existing:
        return response.not_found('League')
    delete_item(LEAGUES_TABLE, {'leagueId': league_id})
    return response.no_content()
