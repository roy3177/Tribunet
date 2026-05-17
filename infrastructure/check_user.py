import boto3

dynamo = boto3.resource('dynamodb', region_name='us-east-1')
table  = dynamo.Table('tribunet-users-prod')

sub = '244824c8-7041-7002-26ae-2d0034de96a6'
item = table.get_item(Key={'userId': sub}).get('Item')

if item:
    print('FOUND in DynamoDB:')
    print('  role :', item.get('role'))
    print('  name :', item.get('name'))
    print('  email:', item.get('email'))
else:
    print('NO RECORD in DynamoDB for sub:', sub)
    print('This is why profile is null and admin button is missing.')
