"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal


seed_leagues.py — Seed Israeli Football Leagues
================================================
Seeds the initial set of Israeli football leagues and cups
into the tribunet-leagues-prod DynamoDB table.

Leagues: ליגת העל, ליגה לאומית, ליגה א', ליגה ב'
Cups:    גביע המדינה, גביע הטוטו, גביע ליגת העל

"""

import boto3, uuid

table = boto3.resource('dynamodb', region_name='us-east-1').Table('tribunet-leagues-prod')

LEAGUES = [
    { 'name': 'ליגת העל',       'level': 1, 'type': 'league' },
    { 'name': 'ליגה לאומית',    'level': 2, 'type': 'league' },
    { 'name': "ליגה א'",        'level': 3, 'type': 'league' },
    { 'name': "ליגה ב'",        'level': 4, 'type': 'league' },
    { 'name': 'גביע המדינה',    'level': 1, 'type': 'cup'    },
    { 'name': 'גביע הטוטו',     'level': 1, 'type': 'cup'    },
    { 'name': 'גביע ליגת העל',  'level': 1, 'type': 'cup'    },
]

with table.batch_writer() as batch:
    for l in LEAGUES:
        item = { 'leagueId': str(uuid.uuid4()), **l }
        batch.put_item(Item=item)
        print(f"  + {l['name']}")

print(f'\nDone — {len(LEAGUES)} leagues seeded.')
