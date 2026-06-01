import boto3
from datetime import datetime, timezone

REGION     = 'us-east-1'
USER_POOL  = 'us-east-1_kcOTW3PmY'
TABLE_NAME = 'tribunet-users-prod'

cognito  = boto3.client('cognito-idp', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table    = dynamodb.Table(TABLE_NAME)

created = 0
skipped = 0

paginator = cognito.get_paginator('list_users')
for page in paginator.paginate(UserPoolId=USER_POOL):
    for u in page['Users']:
        if u['UserStatus'] != 'CONFIRMED':
            print(f'Skipping unconfirmed: {u["Username"]}')
            continue
        attrs = {a['Name']: a['Value'] for a in u['Attributes']}
        sub   = attrs.get('sub', '')
        email = attrs.get('email', '')
        name  = attrs.get('name', email.split('@')[0])

        existing = table.get_item(Key={'userId': sub}).get('Item')
        if existing:
            print(f'Already in DynamoDB: {email}')
            skipped += 1
            continue

        table.put_item(Item={
            'userId':    sub,
            'email':     email,
            'name':      name,
            'role':      'user',
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
        print(f'Created in DynamoDB: {email}')
        created += 1

print(f'\nDone. Created: {created}, Already existed: {skipped}')
