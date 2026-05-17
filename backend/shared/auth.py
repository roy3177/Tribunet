import os
import boto3

_REGION    = os.environ.get('AWS_REGION', 'us-east-1')
_dynamo    = None


def _users_table():
    global _dynamo
    if _dynamo is None:
        _dynamo = boto3.resource('dynamodb', region_name=_REGION).Table(
            os.environ.get('DYNAMODB_USERS_TABLE', '')
        )
    return _dynamo


def get_claims(event: dict) -> dict:
    """
    Extract JWT claims from API Gateway's built-in Cognito authorizer.
    API Gateway already validates the token before the Lambda is invoked.
    """
    try:
        return event['requestContext']['authorizer']['jwt']['claims']
    except (KeyError, TypeError):
        raise PermissionError('Missing or invalid authorization')


def require_admin(event: dict) -> dict:
    """Raises PermissionError if the caller does not have role=admin in DynamoDB."""
    claims  = get_claims(event)
    user_id = claims.get('sub', '')
    item    = _users_table().get_item(Key={'userId': user_id}).get('Item', {})
    if item.get('role', '').strip() != 'admin':
        raise PermissionError('Admin access required')
    return claims
