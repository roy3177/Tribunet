"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

scripts/sync_cognito_to_dynamodb.py — One-Time Cognito → DynamoDB Sync Script
===============================================================================
Run this script ONCE after deployment to populate the DynamoDB Users table
with all existing Cognito users (useful when the Cognito trigger wasn't active
during early development or when restoring a fresh environment).

Usage:
    python sync_cognito_to_dynamodb.py

Requirements:
    - AWS credentials configured locally (aws configure or env vars)
    - The DynamoDB table must already exist (deployed via SAM)
"""

import boto3
from datetime import datetime, timezone

# Target environment — update these if deploying to a different region or stack:
REGION     = 'us-east-1'
USER_POOL  = 'us-east-1_kcOTW3PmY'
TABLE_NAME = 'tribunet-users-prod'

cognito  = boto3.client('cognito-idp', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table    = dynamodb.Table(TABLE_NAME)

# Counters for the final summary report:
created = 0
skipped = 0

# Paginator handles Cognito's 60-user-per-page limit automatically:
paginator = cognito.get_paginator('list_users')
for page in paginator.paginate(UserPoolId=USER_POOL):
    for u in page['Users']:
        # Skip users who haven't confirmed their email — they have no verified identity yet:
        if u['UserStatus'] != 'CONFIRMED':
            print(f'Skipping unconfirmed: {u["Username"]}')
            continue

        # Cognito returns attributes as a list of {Name, Value} dicts — convert to a plain dict:
        attrs = {a['Name']: a['Value'] for a in u['Attributes']}
        sub   = attrs.get('sub', '')           # Cognito UUID — used as DynamoDB partition key
        email = attrs.get('email', '')
        name  = attrs.get('name', email.split('@')[0])  # fallback: username from email

        # Skip users already in DynamoDB — avoid overwriting existing role or profile data:
        existing = table.get_item(Key={'userId': sub}).get('Item')
        if existing:
            print(f'Already in DynamoDB: {email}')
            skipped += 1
            continue

        table.put_item(Item={
            'userId':    sub,
            'email':     email,
            'name':      name,
            'role':      'user',   # all synced users start as regular users
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
        print(f'Created in DynamoDB: {email}')
        created += 1

print(f'\nDone. Created: {created}, Already existed: {skipped}')
