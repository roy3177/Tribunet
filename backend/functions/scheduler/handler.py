import os
import boto3
from datetime import datetime, timezone, timedelta

MATCHES_TABLE = os.environ['DYNAMODB_MATCHES_TABLE']
SNS_TOPIC_ARN = os.environ['ALERTS_TOPIC_ARN']

_dynamo = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
_sns    = boto3.client('sns',      region_name=os.environ.get('AWS_REGION', 'us-east-1'))


def main(event, context):
    today     = datetime.now(timezone.utc).date()
    week_end  = today + timedelta(days=7)
    next_end  = today + timedelta(days=14)

    table   = _dynamo.Table(MATCHES_TABLE)
    matches = table.scan()['Items']

    total      = len(matches)
    this_week  = [m for m in matches if today.isoformat() <= m.get('date', '') <= week_end.isoformat()]
    next_week  = [m for m in matches if week_end.isoformat() < m.get('date', '') <= next_end.isoformat()]

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
