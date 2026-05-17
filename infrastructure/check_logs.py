import boto3
from datetime import datetime, timezone, timedelta

logs = boto3.client('logs', region_name='us-east-1')
end   = datetime.now(timezone.utc)
start = end - timedelta(minutes=10)

for fn in ['UsersFunction-cdcuOOvqCsDp', 'StadiumsFunction-zFUGxOhAn8at', 'MatchesFunction-zZVOugiXoueO']:
    print(f'\n=== {fn} ===')
    resp = logs.filter_log_events(
        logGroupName=f'/aws/lambda/tribunet-prod-{fn}',
        startTime=int(start.timestamp() * 1000),
        endTime=int(end.timestamp() * 1000),
    )
    events = resp.get('events', [])
    print(f'  {len(events)} events in last 10 min')
    for e in events[-8:]:
        msg = e['message'].strip()
        if msg:
            print(' ', msg[:200])
