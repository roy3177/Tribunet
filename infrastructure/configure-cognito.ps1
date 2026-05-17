$UserPoolId = "us-east-1_kcOTW3PmY"
$TriggerFunctionName = "tribunet-prod-CognitoTriggerFunction-1Mjdq6C6QaVJ"

$fnArn = aws lambda get-function `
  --function-name $TriggerFunctionName `
  --query 'Configuration.FunctionArn' `
  --output text

aws cognito-idp update-user-pool `
  --user-pool-id $UserPoolId `
  --auto-verified-attributes email `
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT `
  --lambda-config PostConfirmation=$fnArn

Write-Host "Cognito configured successfully:"
Write-Host "  AutoVerifiedAttributes: email"
Write-Host "  EmailSendingAccount:    COGNITO_DEFAULT"
Write-Host "  PostConfirmation Trigger: $fnArn"
