import boto3, json

iam = boto3.client('iam', region_name='us-east-1')

iam.put_user_policy(
    UserName='tribunet',
    PolicyName='EventBridgeAccess',
    PolicyDocument=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Action": ["events:*"], "Resource": "*"}]
    })
)
print('EventBridge policy added')
