"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

cognito_trigger/handler.py — Cognito Post-Confirmation & Post-Authentication Trigger
======================================================================================
Automatically syncs new users from Cognito into the DynamoDB Users table.
Triggered by two Cognito events:
  - PostConfirmation_ConfirmSignUp: fires once when a user confirms their email.
  - PostAuthentication_Authentication: fires on every login (used as a safety net).

Important: Cognito requires the original event object to be returned unchanged.
Any exception here must NOT be re-raised — it would block the user from signing in.
"""

import os
import boto3
from datetime import datetime, timezone

# Initialize DynamoDB resource at module level — reused across warm Lambda invocations.
dynamodb = boto3.resource('dynamodb')


# Cognito trigger entry point — saves new users to DynamoDB on signup and login:
def main(event, context):

    trigger = event.get('triggerSource', 'UNKNOWN')
    print(f'[trigger] triggerSource={trigger}')

    # Only handle the two relevant trigger types — ignore all others silently.
    handled = (
        'PostConfirmation_ConfirmSignUp',
        'PostAuthentication_Authentication',
    )
    if trigger not in handled:
        print(f'[trigger] Skipping — unhandled trigger')
        return event

    # Cognito passes user attributes as a flat dict (not a list like some other flows).
    attrs   = event['request']['userAttributes']
    user_id = attrs.get('sub', '')    # Cognito's unique user UUID
    email   = attrs.get('email', '')
    name    = attrs.get('name', email.split('@')[0])  # fallback: username from email
    print(f'[trigger] Syncing user: {email} / {user_id}')

    table = dynamodb.Table(os.environ['DYNAMODB_USERS_TABLE'])

    # For login events: only write if user doesn't exist yet (preserve existing role/data).
    # Without this check, every login would reset the user's role back to 'user'.
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
            'role':      'user',   # default role; admin promotes manually via dashboard
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
        print(f'[trigger] Saved to DynamoDB successfully')
    except Exception as exc:
        # Log but do not raise — Cognito requires the event returned regardless.
        # Raising here would prevent the user from completing sign-up.
        print(f'[trigger] ERROR writing to DynamoDB for {email}: {exc}')

    return event  # Cognito requires the original event returned unchanged
