import boto3
from datetime import datetime, timezone, timedelta

region = 'us-east-1'
table_name = 'tribunet-matches-prod'

# 1. Enable TTL on the table
client = boto3.client('dynamodb', region_name=region)
client.update_time_to_live(
    TableName=table_name,
    TimeToLiveSpecification={'Enabled': True, 'AttributeName': 'ttl'}
)
print('TTL enabled on', table_name)

# 2. Backfill existing matches that have no ttl attribute
table = boto3.resource('dynamodb', region_name=region).Table(table_name)
items = table.scan()['Items']

def compute_ttl(date_str):
    dt = datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    return int((dt + timedelta(days=1)).timestamp())

updated = 0
for item in items:
    date_str = item.get('date', '')
    if date_str:
        table.update_item(
            Key={'matchId': item['matchId']},
            UpdateExpression='SET #t = :v',
            ExpressionAttributeNames={'#t': 'ttl'},
            ExpressionAttributeValues={':v': compute_ttl(date_str)},
        )
        updated += 1
        print(f"  Backfilled: {item.get('homeTeam')} vs {item.get('awayTeam')} ({date_str})")

print(f'Done. Backfilled {updated} matches.')
