""""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

matches/handler.py — Match CRUD Lambda
=======================================
Handles all /matches endpoints via a single Lambda entry point (main).
Routes requests based on routeKey injected by API Gateway HTTP API.

Public:   GET /matches, GET /matches/{id}
Admin:    POST /matches, PUT /matches/{id}, DELETE /matches/{id}

@feature F-04 | View Matches List
@feature F-07 | View Match Details
@feature F-13 | Add New Match
@feature F-14 | Edit/Delete Match
"""


import json
import uuid
import base64
from datetime import datetime, timezone, timedelta

from shared import response
from shared.auth import require_admin
from shared.db import (
    MATCHES_TABLE, STADIUMS_TABLE,
    put_item, get_item, delete_item, scan_with_filter, scan_page,
)

# Fields that must be present and non-empty on every match create/update:
REQUIRED_FIELDS = ['homeTeam', 'awayTeam', 'date', 'time', 'stadiumId', 'league']

# Validate match fields. Returns an error message string or None if valid:
def _validate_match(body: dict) -> str | None:
    
    for field in REQUIRED_FIELDS:
        if not body.get(field, '').strip():
            return f'Missing required field: {field}'
    try:
        datetime.strptime(body['date'], '%Y-%m-%d')
    except ValueError:
        return 'Invalid date format, expected YYYY-MM-DD'
    if len(body.get('homeTeam', '')) > 100:
        return 'homeTeam too long'
    if len(body.get('awayTeam', '')) > 100:
        return 'awayTeam too long'
    if body.get('homeTeam') == body.get('awayTeam'):
        return 'homeTeam and awayTeam cannot be the same'
    if body.get('ticketUrl') and not body['ticketUrl'].startswith('http'):
        return 'ticketUrl must be a valid URL'
    return None

# Lambda entry point for /matches — routes to GET / GET {id} / POST / PUT / DELETE handlers:
def main(event, context):

    method    = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /matches':
            return _get_matches(event)
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

# F-04 | View Matches List — Return a paginated list of matches. Supports limit and base64 lastKey cursor:
def _get_matches(event: dict):

    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit', 20)), 100)  # cap at 100

    # Decode cursor from frontend:
    last_key = None
    raw_cursor = params.get('lastKey')
    if raw_cursor:
        try:
            last_key = json.loads(base64.b64decode(raw_cursor).decode())
        except Exception:
            return response.bad_request('Invalid pagination cursor')

    result = scan_page(MATCHES_TABLE, limit=limit, exclusive_start_key=last_key)

    # Encode next cursor for frontend
    next_cursor = None
    if result['lastKey']:
        next_cursor = base64.b64encode(
            json.dumps(result['lastKey']).encode()
        ).decode()

    return response.ok({
        'matches': result['items'],
        'nextKey': next_cursor,  # null = last page
        'count': len(result['items'])
    })

# F-07 | View Match Details — Return a single match by matchId. Returns 404 if not found:
def _get_match(match_id: str):
        
    item = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not item:
        return response.not_found('Match')
    return response.ok(item)

# F-13 | Add New Match — Create a new match. Admin only. Validates fields and resolves stadiumName from stadiumId:
def _create_match(event: dict):

    require_admin(event)
    body = json.loads(event.get('body') or '{}')

    error = _validate_match(body)
    if error:
        return response.bad_request(error)

    stadium_id   = body.get('stadiumId', '')
    stadium_name = _resolve_stadium_name(stadium_id)
    if not stadium_name:
        return response.bad_request('Stadium not found')

    item = {
        'matchId':     str(uuid.uuid4()),
        'homeTeam':    body['homeTeam'].strip(),
        'awayTeam':    body['awayTeam'].strip(),
        'date':        body['date'],
        'time':        body['time'],
        'stadiumId':   stadium_id,
        'stadiumName': stadium_name,
        'league':      body['league'].strip(),
        'hasTickets':  bool(body.get('hasTickets', False)),
        'ticketUrl':   body.get('ticketUrl', '').strip(),
        'createdAt':   datetime.now(timezone.utc).isoformat(),
        'ttl':         _compute_ttl(body['date']),
    }
    put_item(MATCHES_TABLE, item)
    return response.created(item)

# F-14 | Edit Match — Update an existing match by matchId. Admin only. Merges existing fields with new body:
def _update_match(event: dict, match_id: str):

    require_admin(event)

    existing = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not existing:
        return response.not_found('Match')

    body = json.loads(event.get('body') or '{}')

    merged = {**existing, **body}
    error = _validate_match(merged)
    if error:
        return response.bad_request(error)

    stadium_id = body.get('stadiumId', existing.get('stadiumId', ''))
    if stadium_id != existing.get('stadiumId'):
        merged['stadiumName'] = _resolve_stadium_name(stadium_id)

    merged['matchId'] = match_id
    merged['ttl'] = _compute_ttl(merged.get('date', ''))
    put_item(MATCHES_TABLE, merged)
    return response.ok(merged)

# F-14 | Delete Match — Delete a match by matchId. Admin only. Returns 404 if not found:
def _delete_match(event: dict, match_id: str):
        
    require_admin(event)

    existing = get_item(MATCHES_TABLE, {'matchId': match_id})
    if not existing:
        return response.not_found('Match')

    delete_item(MATCHES_TABLE, {'matchId': match_id})
    return response.no_content()

# Calculate Unix TTL timestamp — one day after match date for DynamoDB auto-expiry:
def _compute_ttl(date_str: str) -> int:
        
    if not date_str:
        return 0
    dt = datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    return int((dt + timedelta(days=1)).timestamp())

# Fetch stadium name from DynamoDB by stadiumId. Returns empty string if not found:
def _resolve_stadium_name(stadium_id: str) -> str:
    
    if not stadium_id:
        return ''
    stadium = get_item(STADIUMS_TABLE, {'stadiumId': stadium_id})
    return stadium.get('name', '') if stadium else ''