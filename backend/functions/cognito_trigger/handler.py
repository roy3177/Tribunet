import os
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')


def main(event, context):
    """Cognito trigger — saves/syncs users to DynamoDB on confirmation and on every login."""
    trigger = event.get('triggerSource', 'UNKNOWN')
    print(f'[trigger] triggerSource={trigger}')

    handled = (
        'PostConfirmation_ConfirmSignUp',
        'PostAuthentication_Authentication',
    )
    if trigger not in handled:
        print(f'[trigger] Skipping — unhandled trigger')
        return event

    attrs = event['request']['userAttributes']  # plain dict in Cognito triggers
    user_id = attrs.get('sub', '')
    email   = attrs.get('email', '')
    name    = attrs.get('name', email.split('@')[0])
    print(f'[trigger] Syncing user: {email} / {user_id}')

    table = dynamodb.Table(os.environ['DYNAMODB_USERS_TABLE'])

    # For login events: only write if user doesn't exist yet (preserve existing role/data)
    if trigger == 'PostAuthentication_Authentication':
        existing = table.get_item(Key={'userId': user_id}).get('Item')
        if existing:
            print(f'[trigger] User already in DynamoDB — skipping')
            return event

    try:
        table.put_item(Item={
            'userId':    user_id,
            'email':     email,
            'name':      name,
            'role':      'user',
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
        print(f'[trigger] Saved to DynamoDB successfully')
    except Exception as exc:
        # Log but do not raise — Cognito requires the event returned regardless
        print(f'[trigger] ERROR writing to DynamoDB for {email}: {exc}')

    return event  # Cognito requires the event to be returned unchanged
