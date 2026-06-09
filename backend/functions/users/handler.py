"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026
users/handler.py — User Management Lambda
==========================================
Handles user profile and admin user-management endpoints.
User data lives in two places: Cognito (authentication) and DynamoDB (profile + role).
Deleting a user removes them from both systems.

User:   GET /users/me, PUT /users/me
Admin:  GET /users, DELETE /users/{id}

"""

import os
import boto3
from shared import response
from shared.auth import require_admin, get_claims
from shared.db import USERS_TABLE, scan_with_filter, get_item, put_item, delete_item

_cognito = None

# Return a cached boto3 Cognito client (lazy initialization):
def get_cognito():
    global _cognito
    if _cognito is None:
        _cognito = boto3.client('cognito-idp', region_name=os.environ['AWS_REGION'])
    return _cognito

# Lambda entry point for /users — routes GET /me, PUT /me, GET /users, DELETE /users/{id}:
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

# Return the current user's profile. Auto-creates a DynamoDB record on first login:
def _get_me(event: dict):

    from datetime import datetime, timezone
    claims  = get_claims(event)
    user_id = claims.get('sub', '')
    if not user_id:
        return response.bad_request('Missing user id in token')
    item = get_item(USERS_TABLE, {'userId': user_id})
    if not item:
        # User exists in Cognito but not yet in DynamoDB (e.g. Cognito trigger failed).
        # Auto-create their profile on first GET /users/me so the app never breaks.
        email = claims.get('email', '')
        # Fallback name: use the part before '@' in the email if Cognito name is missing.
        name  = claims.get('name', email.split('@')[0])
        item  = {
            'userId':    user_id,
            'email':     email,
            'name':      name,
            'role':      'user',
            'createdAt': datetime.now(timezone.utc).isoformat(),
        }
        put_item(USERS_TABLE, item)
        print(f'[users] Auto-created DynamoDB record for {email}')
    return response.ok(item)

# Update the current user's display name. Returns 400 if name is empty or too long:
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

# Return all users from DynamoDB. Admin only:
def _get_users(event: dict):
    require_admin(event)
    items = scan_with_filter(USERS_TABLE)
    return response.ok(items)

# Delete a user from both Cognito and DynamoDB by userId. Admin only:
def _delete_user(event: dict):

    require_admin(event)

    user_id = event.get('pathParameters', {}).get('id', '').strip()
    if not user_id:
        return response.bad_request('Missing user id')

    try:
        # Remove from Cognito first — uses the Cognito sub (UUID) as the Username.
        get_cognito().admin_delete_user(
            UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
            Username=user_id,
        )
    except get_cognito().exceptions.UserNotFoundException:
        # User already deleted from Cognito — still clean up DynamoDB.
        pass

    delete_item(USERS_TABLE, {'userId': user_id})
    return response.ok({'deleted': user_id})