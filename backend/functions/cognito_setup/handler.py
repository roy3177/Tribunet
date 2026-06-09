"""
@ author: Roy Meoded
@ author: Yarin Keshet
@ author: Tomer Gal

@ date: 08-06-2026

cognito_setup/handler.py — CloudFormation Custom Resource Lambda
=================================================================
Runs once during CloudFormation stack deployment (Create/Update).
Attaches the cognito_trigger Lambda to the Cognito User Pool as a
PostConfirmation and PostAuthentication trigger, and enables email
auto-verification.

This is a CloudFormation Custom Resource — it must always respond to
the ResponseURL (SUCCESS or FAILED), otherwise the stack deployment
will hang and eventually time out.
"""

import boto3
import json
import urllib.request


# CloudFormation Custom Resource response helper — sends result back to the stack:
def _respond(event, context, status, data=None):
    # CloudFormation requires a signed PUT to the pre-signed ResponseURL.
    body = json.dumps({
        'Status': status,
        'Reason': f'See CloudWatch: {context.log_stream_name}',
        'PhysicalResourceId': event.get('PhysicalResourceId', context.log_stream_name),
        'StackId':            event['StackId'],
        'RequestId':          event['RequestId'],
        'LogicalResourceId':  event['LogicalResourceId'],
        'Data':               data or {},
    }).encode()
    req = urllib.request.Request(
        url=event['ResponseURL'],
        data=body,
        headers={'Content-Type': ''},  # CloudFormation requires empty Content-Type
        method='PUT',
    )
    urllib.request.urlopen(req)


# CloudFormation Custom Resource entry point — wires Cognito triggers on stack deploy:
def main(event, context):
    print(f'[cognito-setup] RequestType={event["RequestType"]}')
    try:
        props        = event['ResourceProperties']
        user_pool_id = props['UserPoolId']
        lambda_arn   = props['LambdaArn']  # ARN of the cognito_trigger Lambda

        # Only act on Create or Update — Delete is a no-op (Cognito pool is deleted with the stack).
        if event['RequestType'] in ('Create', 'Update'):
            boto3.client('cognito-idp').update_user_pool(
                UserPoolId=user_pool_id,
                LambdaConfig={
                    'PostConfirmation':   lambda_arn,   # fires after email confirmation
                    'PostAuthentication': lambda_arn,   # fires after every login
                },
                AutoVerifiedAttributes=['email'],  # Cognito auto-confirms email on signup
            )
            print(f'[cognito-setup] Trigger + AutoVerifiedAttributes set on {user_pool_id}')

        _respond(event, context, 'SUCCESS')
    except Exception as exc:
        print(f'[cognito-setup] ERROR: {exc}')
        # Must still respond FAILED — not responding causes CloudFormation to hang for 1 hour.
        _respond(event, context, 'FAILED', {'Error': str(exc)})
