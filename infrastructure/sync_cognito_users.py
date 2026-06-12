"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

sync_cognito_users.py — Cognito → DynamoDB User Backfill
=========================================================
One-time backfill script that syncs all existing Cognito users into the
tribunet-users-prod DynamoDB table. Skips users that already exist,
preserving their current role and data.

Run:  python infrastructure/sync_cognito_users.py

"""

import boto3
from datetime import timezone

REGION        = 'us-east-1'
USER_POOL_ID  = 'us-east-1_kcOTW3PmY'
USERS_TABLE   = 'tribunet-users-prod'

cognito = boto3.client('cognito-idp', region_name=REGION)
table   = boto3.resource('dynamodb', region_name=REGION).Table(USERS_TABLE)


def list_cognito_users():
    users = []
    kwargs = {'UserPoolId': USER_POOL_ID, 'Limit': 60}
    while True:
        resp = cognito.list_users(**kwargs)
        users.extend(resp['Users'])
        token = resp.get('PaginationToken')
        if not token:
            break
        kwargs['PaginationToken'] = token
    return users


def get_attr(user, attr_name, default=''):
    for a in user.get('Attributes', []):
        if a['Name'] == attr_name:
            return a['Value']
    return default


def main():
    print(f'Fetching users from Cognito pool {USER_POOL_ID}...')
    cognito_users = list_cognito_users()
    print(f'  Found {len(cognito_users)} Cognito users')

    total = len(cognito_users)
    already_synced = 0
    newly_synced   = 0
    errors         = 0

    for user in cognito_users:
        user_id = get_attr(user, 'sub')
        email   = get_attr(user, 'email')
        name    = get_attr(user, 'name', email.split('@')[0] if email else 'Unknown')

        if not user_id:
            print(f'  [WARN] No sub for {email} — skipping')
            errors += 1
            continue

        # Check if already in DynamoDB
        resp = table.get_item(Key={'userId': user_id})
        if resp.get('Item'):
            print(f'  [SKIP] {email} — already in DynamoDB')
            already_synced += 1
            continue

        # Build createdAt from Cognito UserCreateDate (datetime object)
        created_at = user.get('UserCreateDate')
        if created_at:
            created_at = created_at.astimezone(timezone.utc).isoformat()
        else:
            from datetime import datetime
            created_at = datetime.now(timezone.utc).isoformat()

        try:
            table.put_item(Item={
                'userId':    user_id,
                'email':     email,
                'name':      name,
                'role':      'user',
                'createdAt': created_at,
            })
            print(f'  [SYNC] {email} — created in DynamoDB')
            newly_synced += 1
        except Exception as e:
            print(f'  [ERROR] {email} — {e}')
            errors += 1

    print()
    print('=== Sync complete ===')
    print(f'  Total Cognito users : {total}')
    print(f'  Already in DynamoDB : {already_synced}')
    print(f'  Newly synced        : {newly_synced}')
    print(f'  Errors              : {errors}')


if __name__ == '__main__':
    main()
