import boto3, uuid
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('tribunet-stadiums-prod')
now = datetime.now(timezone.utc).isoformat()

stadiums = [
    ('גרין',                 'נוף הגליל',   Decimal('32.7056'), Decimal('35.3272')),
    ('דוחה',                 'סכנין',        Decimal('32.8659'), Decimal('35.3025')),
    ('הי"א',                 'אשדוד',        Decimal('31.8044'), Decimal('34.6553')),
    ('רמת גן',               'רמת גן',       Decimal('32.0697'), Decimal('34.8219')),
    ('הברפלד',               'ראשון לציון',  Decimal('31.9730'), Decimal('34.7925')),
    ('השלום',                'אום אל-פחם',   Decimal('32.5149'), Decimal('35.1522')),
    ('לויטה',                'כפר סבא',      Decimal('32.1800'), Decimal('34.9100')),
    ('עירוני קריית שמונה',   'קריית שמונה',  Decimal('33.2077'), Decimal('35.5695')),
    ('סלה',                  'אשקלון',       Decimal('31.6688'), Decimal('34.5742')),
]

for name, city, lat, lng in stadiums:
    table.put_item(Item={
        'stadiumId': str(uuid.uuid4()),
        'name': name,
        'city': city,
        'lat': lat,
        'lng': lng,
        'createdAt': now,
    })
    print(f'Added: {name} - {city}')

print('Done.')
