""""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

db.py — DynamoDB Access Layer
==============================
Centralized helpers for all DynamoDB operations used across Lambda functions.
All table names are read from environment variables (defined in sam-template.yaml).

"""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

# Singleton DynamoDB resource — reused across warm Lambda invocations:
_dynamodb = None

def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
    return _dynamodb

# Return a DynamoDB Table object. table_env_var is the env var holding the table name:
def get_table(table_env_var: str):
    table_name = os.environ[table_env_var]
    return get_dynamodb().Table(table_name)


# ---------------------------------------------------------------------------
# Table name constants (match env var names defined in sam-template.yaml)
# ---------------------------------------------------------------------------
USERS_TABLE     = 'DYNAMODB_USERS_TABLE'
MATCHES_TABLE   = 'DYNAMODB_MATCHES_TABLE'
STADIUMS_TABLE  = 'DYNAMODB_STADIUMS_TABLE'
FAVORITES_TABLE = 'DYNAMODB_FAVORITES_TABLE'
TEAMS_TABLE     = 'DYNAMODB_TEAMS_TABLE'
LEAGUES_TABLE   = 'DYNAMODB_LEAGUES_TABLE'


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

# Creates or fully replaces an item. If an item with the same key exists, it is overwritten:
def put_item(table_env_var: str, item: dict) -> dict:
    table = get_table(table_env_var)
    table.put_item(Item=item)
    return item

# Returns a single item by its primary key, or None if not found:
def get_item(table_env_var: str, key: dict) -> dict | None:
    table = get_table(table_env_var)
    result = table.get_item(Key=key)
    return result.get('Item')

# Deletes an item by its primary key. No error if the item doesn't exist:
def delete_item(table_env_var: str, key: dict) -> None:
    table = get_table(table_env_var)
    table.delete_item(Key=key)

# Scans the entire table and returns all matching items.
# Handles DynamoDB pagination automatically — loops until LastEvaluatedKey is gone.
# WARNING: expensive on large tables; use query_gsi when possible.
def scan_with_filter(table_env_var: str, filter_expression=None) -> list[dict]:
    table = get_table(table_env_var)
    kwargs = {}
    if filter_expression is not None:
        kwargs['FilterExpression'] = filter_expression
    result = table.scan(**kwargs)
    items = result.get('Items', [])
    while 'LastEvaluatedKey' in result:
        kwargs['ExclusiveStartKey'] = result['LastEvaluatedKey']
        result = table.scan(**kwargs)
        items.extend(result.get('Items', []))
    return items

# Single-page scan for pagination. Returns items + next cursor key:
def scan_page(table_env_var: str, limit: int, exclusive_start_key: dict | None = None, filter_expression=None) -> dict:
    table = get_table(table_env_var)
    kwargs = {'Limit': limit}
    if filter_expression is not None:
        kwargs['FilterExpression'] = filter_expression
    if exclusive_start_key is not None:
        kwargs['ExclusiveStartKey'] = exclusive_start_key
    result = table.scan(**kwargs)
    return {
        'items': result.get('Items', []),
        'lastKey': result.get('LastEvaluatedKey')  # None if no more pages
    }

# Queries a Global Secondary Index (GSI) — faster and cheaper than a full scan.
# Used when filtering by a non-primary-key attribute (e.g. userId in Favorites).
def query_gsi(table_env_var: str, index_name: str, key_condition, filter_expression=None) -> list[dict]:
    table = get_table(table_env_var)
    kwargs = {
        'IndexName': index_name,
        'KeyConditionExpression': key_condition,
    }
    if filter_expression is not None:
        kwargs['FilterExpression'] = filter_expression
    result = table.query(**kwargs)
    items = result.get('Items', [])
    while 'LastEvaluatedKey' in result:
        kwargs['ExclusiveStartKey'] = result['LastEvaluatedKey']
        result = table.query(**kwargs)
        items.extend(result.get('Items', []))
    return items
