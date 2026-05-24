import json
from datetime import datetime, timezone

from shared import response
from shared.auth import get_claims
from shared.db import (
    FAVORITES_TABLE, MATCHES_TABLE,
    put_item, get_item, delete_item, get_dynamodb,
)
import os
from boto3.dynamodb.conditions import Key


def main(event, context):
    method    = event['requestContext']['http']['method']
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        claims  = get_claims(event)
        user_id = claims['sub']

        if not user_id:
            return response.bad_request('Missing user id in token')

        if route_key == 'GET /favorites':
            return _get_favorites(user_id)
        elif route_key == 'POST /favorites/{id}':
            match_id = event.get('pathParameters', {}).get('id', '').strip()
            if not match_id:
                return response.bad_request('Missing match id')
            return _add_favorite(user_id, match_id)
        elif route_key == 'DELETE /favorites/{id}':
            match_id = event.get('pathParameters', {}).get('id', '').strip()
            if not match_id:
                return response.bad_request('Missing match id')
            return _remove_favorite(user_id, match_id)
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.unauthorized(str(e))
    except Exception as e:
        print(f'[favorites] Unhandled error: {e}')
        return response.server_error()


def _get_favorites(user_id: str):
    table  = get_dynamodb().Table(os.environ['DYNAMODB_FAVORITES_TABLE'])
    result = table.query(KeyConditionExpression=Key('userId').eq(user_id))
    favs   = result.get('Items', [])

    enriched = []
    for fav in favs:
        match = get_item(MATCHES_TABLE, {'matchId': fav['matchId']})
        if match:
            enriched.append(match)

    return response.ok(enriched)


def _add_favorite(user_id: str, match_id: str):
    match = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not match:
        return response.not_found('Match')

    item = {
        'userId':    user_id,
        'matchId':   match_id,
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    put_item(FAVORITES_TABLE, item)
    return response.created(item)


def _remove_favorite(user_id: str, match_id: str):
    existing = get_item(FAVORITES_TABLE, {'userId': user_id, 'matchId': match_id})
    if not existing:
        return response.not_found('Favorite')

    delete_item(FAVORITES_TABLE, {'userId': user_id, 'matchId': match_id})
    return response.no_content()