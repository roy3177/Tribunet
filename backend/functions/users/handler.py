import os
import boto3
from shared import response
from shared.auth import require_admin, get_claims
from shared.db import USERS_TABLE, scan_with_filter, get_item, put_item, delete_item

_cognito = None

def get_cognito():
    global _cognito
    if _cognito is None:
        _cognito = boto3.client('cognito-idp', region_name=os.environ['AWS_REGION'])
    return _cognito


def main(event, context):
    method    = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /users/me':
            return _get_me(event)
        elif route_key == 'PUT /users/me':
            return _update_me(event)
        elif route_key == 'GET /users':
            return _get_users(event)
        elif route_key == 'DELETE /users/{id}':
            return _delete_user(event)
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[users] Unhandled error: {e}')
        return response.server_error()


def _get_me(event: dict):
    claims  = get_claims(event)
    user_id = claims.get('sub', '')
    if not user_id:
        return response.bad_request('Missing user id in token')
    item = get_item(USERS_TABLE, {'userId': user_id})
    if not item:
        return response.not_found('User')
    return response.ok(item)


def _update_me(event: dict):
    import json
    claims  = get_claims(event)
    user_id = claims.get('sub', '')
    if not user_id:
        return response.bad_request('Missing user id in token')

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    if not name:
        return response.bad_request('Name is required')
    if len(name) > 100:
        return response.bad_request('Name too long')

    existing = get_item(USERS_TABLE, {'userId': user_id})
    if not existing:
        return response.not_found('User')

    updated = {**existing, 'name': name}
    put_item(USERS_TABLE, updated)
    return response.ok(updated)


def _get_users(event: dict):
    require_admin(event)
    items = scan_with_filter(USERS_TABLE)
    return response.ok(items)


def _delete_user(event: dict):
    require_admin(event)

    user_id = event.get('pathParameters', {}).get('id', '').strip()
    if not user_id:
        return response.bad_request('Missing user id')

    try:
        get_cognito().admin_delete_user(
            UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
            Username=user_id,
        )
    except get_cognito().exceptions.UserNotFoundException:
        pass

    delete_item(USERS_TABLE, {'userId': user_id})
    return response.ok({'deleted': user_id})