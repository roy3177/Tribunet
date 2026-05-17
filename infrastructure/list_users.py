import boto3
table = boto3.resource('dynamodb', region_name='us-east-1').Table('tribunet-users-prod')
items = table.scan()['Items']
for u in items:
    print(f"{u.get('role','user'):8} | {u.get('email','?'):42} | {u.get('name','?')}")
