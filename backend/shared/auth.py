""""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

auth.py — Authentication & Authorization Helpers
=================================================
Handles JWT claim extraction and role-based access control for Lambda functions.
API Gateway (with Cognito JWT authorizer) validates the token BEFORE the Lambda runs,
so here we only need to read the pre-verified claims from the event context.

Role check is done against DynamoDB (not Cognito) — the role field is stored
in the Users table and managed by the admin.

"""


import os
import boto3

# Lazy-initialized DynamoDB client — created once per Lambda container lifecycle:
_REGION    = os.environ.get('AWS_REGION', 'us-east-1')
_dynamo    = None


# Singleton pattern: reuses the DynamoDB Table object across warm Lambda invocations
# to avoid reconnecting on every request.
def _users_table():
    global _dynamo
    if _dynamo is None:
        _dynamo = boto3.resource('dynamodb', region_name=_REGION).Table(
            os.environ.get('DYNAMODB_USERS_TABLE', '')
        )
    return _dynamo


# Returns the decoded JWT payload injected by API Gateway's Cognito authorizer.
# Raises PermissionError if the token is missing (should not happen in normal flow):
def get_claims(event: dict) -> dict:

    try:
        return event['requestContext']['authorizer']['jwt']['claims']
    except (KeyError, TypeError):
        raise PermissionError('Missing or invalid authorization')

# Verifies the calling user has role='admin' in DynamoDB.
# 'sub' is Cognito's unique user identifier (UUID), used as the DynamoDB partition key.
def require_admin(event: dict) -> dict:
    claims  = get_claims(event)
    user_id = claims.get('sub', '')
    item    = _users_table().get_item(Key={'userId': user_id}).get('Item', {})
    if item.get('role', '').strip() != 'admin':
        raise PermissionError('Admin access required')
    return claims
