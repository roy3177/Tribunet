import boto3
import json
import urllib.request


def _respond(event, context, status, data=None):
    body = json.dumps({
        'Status': status,
        'Reason': f'See CloudWatch: {context.log_stream_name}',
        'PhysicalResourceId': event.get('PhysicalResourceId', context.log_stream_name),
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data or {},
    }).encode()
    req = urllib.request.Request(
        url=event['ResponseURL'],
        data=body,
        headers={'Content-Type': ''},
        method='PUT',
    )
    urllib.request.urlopen(req)


def main(event, context):
    print(f'[cognito-setup] RequestType={event["RequestType"]}')
    try:
        props        = event['ResourceProperties']
        user_pool_id = props['UserPoolId']
        lambda_arn   = props['LambdaArn']

        if event['RequestType'] in ('Create', 'Update'):
            boto3.client('cognito-idp').update_user_pool(
                UserPoolId=user_pool_id,
                LambdaConfig={
                    'PostConfirmation':    lambda_arn,
                    'PostAuthentication':  lambda_arn,
                },
                AutoVerifiedAttributes=['email'],
            )
            print(f'[cognito-setup] Trigger + AutoVerifiedAttributes set on {user_pool_id}')

        _respond(event, context, 'SUCCESS')
    except Exception as exc:
        print(f'[cognito-setup] ERROR: {exc}')
        _respond(event, context, 'FAILED', {'Error': str(exc)})
