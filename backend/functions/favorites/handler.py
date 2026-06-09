"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026
favorites/handler.py — User Favorites Lambda
=============================================
Handles all /favorites endpoints for authenticated users.
Each favorite is stored as a (userId, matchId) pair in DynamoDB.
GET /favorites returns full match data, not just IDs — enriched by joining with the Matches table.

Auth: all endpoints require a valid JWT (regular user or admin).

"""

import os
from datetime import datetime, timezone

from boto3.dynamodb.conditions import Key

from shared import response
from shared.auth import get_claims
from shared.db import (
    FAVORITES_TABLE, MATCHES_TABLE,
    put_item, get_item, delete_item, get_dynamodb,
)

# Lambda entry point for /favorites — routes to GET / POST {id} / DELETE {id} handlers:
def main(event, context):

    method    = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        # Extract user identity from the pre-verified JWT claims injected by API Gateway.
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

# Get all favorites for the current user, enriched with full match data. Returns an empty list if no favorites:
def _get_favorites(user_id: str):

    # Query by userId (partition key of the Favorites GSI) to get all saved matchIds.
    table  = get_dynamodb().Table(os.environ['DYNAMODB_FAVORITES_TABLE'])
    result = table.query(KeyConditionExpression=Key('userId').eq(user_id))
    favs   = result.get('Items', [])

    # Enrich each favorite with full match data from the Matches table.
    # Skips matches that have been deleted (TTL-expired or manually removed).
    enriched = []
    for fav in favs:
        match = get_item(MATCHES_TABLE, {'matchId': fav['matchId']})
        if match:
            enriched.append(match)

    return response.ok(enriched)

# Add a match to the current user's favorites. Returns 404 if the match does not exist. Idempotent — adding the same match multiple times has no effect.
def _add_favorite(user_id: str, match_id: str):

    # Verify the match exists before saving the favorite — prevents orphaned records.
    match = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not match:
        return response.not_found('Match')

    item = {
        'userId':    user_id,   # Cognito sub — partition key
        'matchId':   match_id,  # sort key
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    put_item(FAVORITES_TABLE, item)
    return response.created(item)


# Remove a match from the current user's favorites. Returns 404 if the favorite does not exist.
def _remove_favorite(user_id: str, match_id: str):

    existing = get_item(FAVORITES_TABLE, {'userId': user_id, 'matchId': match_id})
    if not existing:
        return response.not_found('Favorite')

    delete_item(FAVORITES_TABLE, {'userId': user_id, 'matchId': match_id})
    return response.no_content()