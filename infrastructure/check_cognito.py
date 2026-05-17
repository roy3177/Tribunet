import boto3

client = boto3.client('cognito-idp', region_name='us-east-1')
pool_clients = client.list_user_pool_clients(
    UserPoolId='us-east-1_kcOTW3PmY', MaxResults=10
)
for c in pool_clients['UserPoolClients']:
    print('ClientId:', c['ClientId'])
    print('Name    :', c['ClientName'])
    print()

# Also show what the API Gateway authorizer expects
api = boto3.client('apigatewayv2', region_name='us-east-1')
apis = api.get_apis()['Items']
tribunet_api = next((a for a in apis if 'tribunet' in a.get('Name','').lower()), None)
if tribunet_api:
    api_id = tribunet_api['ApiId']
    auths = api.get_authorizers(ApiId=api_id)['Items']
    for a in auths:
        print('Authorizer      :', a['Name'])
        print('JWT Audience    :', a.get('JwtConfiguration', {}).get('Audience'))
        print('JWT Issuer      :', a.get('JwtConfiguration', {}).get('Issuer'))
