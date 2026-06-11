"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

tests/conftest.py — Shared Pytest Fixtures & Configuration
============================================================
Provides shared utilities and fixtures used across all backend test files.

- Sets up required environment variables before any handler module is imported
  (Lambda handlers read env vars at module level, so they must exist beforehand).
- make_event(): builds a fake API Gateway HTTP v2 event for unit tests.
- mock_table(): returns a MagicMock that simulates a boto3 DynamoDB Table.
"""

import os
import json
import pytest
from unittest.mock import MagicMock

# Environment variables must be set BEFORE importing any handler module,
# because Lambda handlers initialize DynamoDB clients at module level using os.environ.
os.environ.setdefault('AWS_REGION',                'us-east-1')
os.environ.setdefault('DYNAMODB_USERS_TABLE',      'test-users')
os.environ.setdefault('DYNAMODB_MATCHES_TABLE',    'test-matches')
os.environ.setdefault('DYNAMODB_STADIUMS_TABLE',   'test-stadiums')
os.environ.setdefault('DYNAMODB_FAVORITES_TABLE',  'test-favorites')
os.environ.setdefault('DYNAMODB_TEAMS_TABLE',      'test-teams')
os.environ.setdefault('DYNAMODB_LEAGUES_TABLE',    'test-leagues')
os.environ.setdefault('FRONTEND_URL',              'http://localhost:3000')
os.environ.setdefault('COGNITO_USER_POOL_ID',      'us-east-1_testpool')
os.environ.setdefault('ALERTS_TOPIC_ARN',          'arn:aws:sns:us-east-1:123456789012:test-topic')


# Builds a minimal API Gateway HTTP v2 event to simulate incoming Lambda requests in tests:
def make_event(method, route_key, body=None, path_params=None, qs=None, sub='user-123'):
    return {
        'requestContext': {
            'http': {'method': method},
            # Simulates the JWT claims injected by API Gateway's Cognito authorizer.
            'authorizer': {'jwt': {'claims': {'sub': sub, 'email': 'test@example.com'}}},
        },
        'routeKey':            route_key,
        'body':                json.dumps(body) if body is not None else None,
        'pathParameters':      path_params or {},
        'queryStringParameters': qs or {},
    }


# Pytest fixture: MagicMock that behaves like a boto3 DynamoDB Table:
@pytest.fixture
def mock_table():
    table = MagicMock()
    # Default return values simulate an empty database — tests override as needed.
    table.get_item.return_value    = {}
    table.put_item.return_value    = {}
    table.delete_item.return_value = {}
    table.scan.return_value        = {'Items': []}
    table.query.return_value       = {'Items': []}
    return table
