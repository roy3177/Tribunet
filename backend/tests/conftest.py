import os
import json
import pytest
from unittest.mock import MagicMock

# Set all required env vars at module level so handler module-level code works
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('DYNAMODB_USERS_TABLE', 'test-users')
os.environ.setdefault('DYNAMODB_MATCHES_TABLE', 'test-matches')
os.environ.setdefault('DYNAMODB_STADIUMS_TABLE', 'test-stadiums')
os.environ.setdefault('DYNAMODB_FAVORITES_TABLE', 'test-favorites')
os.environ.setdefault('DYNAMODB_TEAMS_TABLE', 'test-teams')
os.environ.setdefault('DYNAMODB_LEAGUES_TABLE', 'test-leagues')
os.environ.setdefault('FRONTEND_URL', 'http://localhost:3000')
os.environ.setdefault('COGNITO_USER_POOL_ID', 'us-east-1_testpool')
os.environ.setdefault('ALERTS_TOPIC_ARN', 'arn:aws:sns:us-east-1:123456789012:test-topic')


def make_event(method, route_key, body=None, path_params=None, qs=None, sub='user-123'):
    """Build a minimal API Gateway HTTP v2 event."""
    return {
        'requestContext': {
            'http': {'method': method},
            'authorizer': {'jwt': {'claims': {'sub': sub, 'email': 'test@example.com'}}},
        },
        'routeKey': route_key,
        'body': json.dumps(body) if body is not None else None,
        'pathParameters': path_params or {},
        'queryStringParameters': qs or {},
    }


@pytest.fixture
def mock_table():
    """MagicMock that behaves like a boto3 DynamoDB Table."""
    table = MagicMock()
    table.get_item.return_value = {}
    table.put_item.return_value = {}
    table.delete_item.return_value = {}
    table.scan.return_value = {'Items': []}
    table.query.return_value = {'Items': []}
    return table
