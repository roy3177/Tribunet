import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

_dynamodb = None

def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
    return _dynamodb

def get_table(table_env_var: str):
    """Return a DynamoDB Table object. table_env_var is the env var holding the table name."""
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

def put_item(table_env_var: str, item: dict) -> dict:
    table = get_table(table_env_var)
    table.put_item(Item=item)
    return item

def get_item(table_env_var: str, key: dict) -> dict | None:
    table = get_table(table_env_var)
    result = table.get_item(Key=key)
    return result.get('Item')

def delete_item(table_env_var: str, key: dict) -> None:
    table = get_table(table_env_var)
    table.delete_item(Key=key)

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
