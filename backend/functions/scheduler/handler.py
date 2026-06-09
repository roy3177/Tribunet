"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

scheduler/handler.py — EventBridge Weekly Report Lambda
=========================================================
Triggered automatically every Sunday at 07:00 UTC via Amazon EventBridge.
Scans all active matches in DynamoDB, builds a Hebrew summary report,
and publishes it to an SNS topic (which emails the admin team).

The report includes:
  - Total active matches
  - Matches scheduled this week
  - Matches scheduled next week
  - A warning if fewer than 5 matches are active
"""

import os
import boto3
from datetime import datetime, timezone, timedelta

MATCHES_TABLE = os.environ['DYNAMODB_MATCHES_TABLE']
SNS_TOPIC_ARN = os.environ['ALERTS_TOPIC_ARN']

# Both clients initialized at module level — reused across warm Lambda invocations.
_dynamo = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
_sns    = boto3.client('sns',        region_name=os.environ.get('AWS_REGION', 'us-east-1'))


# EventBridge weekly trigger — scans all matches and sends a Hebrew summary report via SNS:
def main(event, context):

    today    = datetime.now(timezone.utc).date()
    week_end = today + timedelta(days=7)
    next_end = today + timedelta(days=14)

    # Full table scan — acceptable here since this job runs once a week, not per-request.
    table   = _dynamo.Table(MATCHES_TABLE)
    matches = table.scan()['Items']

    total     = len(matches)
    # Filter by date string comparison (ISO format allows direct string sorting).
    this_week = [m for m in matches if today.isoformat() <= m.get('date', '') <= week_end.isoformat()]
    next_week = [m for m in matches if week_end.isoformat() < m.get('date', '') <= next_end.isoformat()]

    # Alert admin if the platform is running low on upcoming matches.
    warning = ''
    if total < 5:
        warning = '\n⚠️ פחות מ-5 משחקים פעילים — מומלץ להוסיף משחקים חדשים!'

    message = (
        f'דוח משחקים שבועי — Tribunet\n'
        f'תאריך: {today.isoformat()}\n\n'
        f'סה"כ משחקים פעילים: {total}\n'
        f'משחקים השבוע ({today} עד {week_end}): {len(this_week)}\n'
        f'משחקים שבוע הבא: {len(next_week)}'
        f'{warning}'
    )

    _sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject='Tribunet — דוח משחקים שבועי',
        Message=message,
    )

    print(f'[scheduler] Report sent. total={total}, this_week={len(this_week)}, next_week={len(next_week)}')
    return {'status': 'ok', 'total': total}
