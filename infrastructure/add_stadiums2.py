import boto3, uuid
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('tribunet-stadiums-prod')
now = datetime.now(timezone.utc).isoformat()

stadiums = [
    ('טוטו עכו',              'עכו',           Decimal('32.9271'), Decimal('35.0700')),
    ('עילוט',                 'עילוט',          Decimal('32.7197'), Decimal('35.2056')),
    ('גרונדמן',               'רמת השרון',      Decimal('32.1456'), Decimal('34.8394')),
    ('עירוני נס ציונה',       'נס ציונה',       Decimal('31.9299'), Decimal('34.7978')),
    ('עירוני חולון',          'חולון',          Decimal('32.0158'), Decimal('34.7791')),
    ('עירוני נתיבות',         'נתיבות',         Decimal('31.4206'), Decimal('34.5900')),
    ('עירוני לוד',            'לוד',            Decimal('31.9518'), Decimal('34.8978')),
    ('הלוחמים',               'חולון',          Decimal('32.0200'), Decimal('34.7750')),
    ('עירוני עפולה',          'עפולה',          Decimal('32.6069'), Decimal('35.2896')),
    ('עירוני בית שאן',        'בית שאן',        Decimal('32.4991'), Decimal('35.4990')),
    ('עירוני בת ים',          'בת ים',          Decimal('32.0175'), Decimal('34.7447')),
    ('שכונת התקווה',          'תל אביב',        Decimal('32.0584'), Decimal('34.8029')),
    ('נשר',                   'נשר',            Decimal('32.7764'), Decimal('35.0272')),
    ('קרני',                  'רעננה',          Decimal('32.1842'), Decimal('34.8709')),
    ("ג'קי לוי",              'יבנה',           Decimal('31.8725'), Decimal('34.7444')),
    ('מחמוד א-סאח',           'עראבה',          Decimal('32.8524'), Decimal('35.3395')),
    ('קריית אונו',            'קריית אונו',     Decimal('32.0590'), Decimal('34.8662')),
    ('טוטו שדרות',            'שדרות',          Decimal('31.5250'), Decimal('34.5962')),
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

print(f'Done. Added {len(stadiums)} stadiums.')
