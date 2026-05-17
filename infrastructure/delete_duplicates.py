import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('tribunet-stadiums-prod')

to_delete = [
    "43dda886-6c44-40c4-bd5f-4ed615053852",
    "6fe8c2ef-b978-422c-b1ad-3256e97babe2",
    "9e38e54a-b6cb-4139-9c34-b454d08499f8",
    "87cd4cf1-0d9b-4469-b5b8-dc2ab65d82d3",
    "1b1c914e-3c96-455d-a203-af1c5ba0c87f",
]

for sid in to_delete:
    table.delete_item(Key={'stadiumId': sid})
    print(f'Deleted: {sid}')

print('Done.')
