import json
import uuid
from datetime import datetime, timezone

from shared import response
from shared.auth import require_admin
from shared.db import TEAMS_TABLE, put_item, get_item, delete_item, scan_with_filter


def main(event, context):
    method    = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /teams':
            return _get_teams()
        elif route_key == 'GET /teams/{id}':
            return _get_team(event['pathParameters']['id'])
        elif route_key == 'POST /teams':
            return _create_team(event)
        elif route_key == 'PUT /teams/{id}':
            return _update_team(event, event['pathParameters']['id'])
        elif route_key == 'DELETE /teams/{id}':
            return _delete_team(event, event['pathParameters']['id'])
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[teams] Unhandled error: {e}')
        return response.server_error()


def _get_teams():
    items = scan_with_filter(TEAMS_TABLE)
    return response.ok(sorted(items, key=lambda x: x.get('name', '')))


def _get_team(team_id: str):
    item = get_item(TEAMS_TABLE, {'teamId': team_id})
    if not item:
        return response.not_found('Team')
    return response.ok(item)


def _create_team(event: dict):
    require_admin(event)
    body = json.loads(event.get('body') or '{}')
    item = {
        'teamId':    str(uuid.uuid4()),
        'name':      body.get('name', ''),
        'league':    body.get('league', ''),
        'city':      body.get('city', ''),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    put_item(TEAMS_TABLE, item)
    return response.created(item)


def _update_team(event: dict, team_id: str):
    require_admin(event)
    existing = get_item(TEAMS_TABLE, {'teamId': team_id})
    if not existing:
        return response.not_found('Team')
    body    = json.loads(event.get('body') or '{}')
    updated = {**existing, **body, 'teamId': team_id}
    put_item(TEAMS_TABLE, updated)
    return response.ok(updated)


def _delete_team(event: dict, team_id: str):
    require_admin(event)
    existing = get_item(TEAMS_TABLE, {'teamId': team_id})
    if not existing:
        return response.not_found('Team')
    delete_item(TEAMS_TABLE, {'teamId': team_id})
    return response.no_content()
