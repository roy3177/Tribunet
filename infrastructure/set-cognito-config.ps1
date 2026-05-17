# ============================================================
# set-cognito-config.ps1
# Applies ALL Cognito User Pool settings in one atomic call.
#
# IMPORTANT: Always use this script for ANY Cognito change.
# Never run aws cognito-idp update-user-pool manually without
# including every setting below — AWS resets omitted fields.
# ============================================================

$USER_POOL_ID  = "us-east-1_kcOTW3PmY"
$LAMBDA_ARN    = "arn:aws:lambda:us-east-1:765776787085:function:tribunet-prod-CognitoTriggerFunction-1Mjdq6C6QaVJ"
$SES_ARN       = "arn:aws:ses:us-east-1:765776787085:identity/tribunet15@gmail.com"
$FROM_EMAIL    = "Tribunet <tribunet15@gmail.com>"
$REGION        = "us-east-1"

Write-Host "Applying Cognito configuration..." -ForegroundColor Cyan

aws cognito-idp update-user-pool `
  --user-pool-id $USER_POOL_ID `
  --region $REGION `
  --auto-verified-attributes email `
  --lambda-config "PostConfirmation=$LAMBDA_ARN,PostAuthentication=$LAMBDA_ARN" `
  --email-configuration "EmailSendingAccount=COGNITO_DEFAULT"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Verifying..." -ForegroundColor Green

    $result = aws cognito-idp describe-user-pool `
        --user-pool-id $USER_POOL_ID `
        --region $REGION `
        --query "UserPool.{Lambda:LambdaConfig,AutoVerified:AutoVerifiedAttributes,Email:EmailConfiguration.From}" `
        --output json | ConvertFrom-Json

    Write-Host "Lambda trigger : $($result.Lambda.PostConfirmation)" -ForegroundColor Green
    Write-Host "AutoVerified   : $($result.AutoVerified)" -ForegroundColor Green
    Write-Host "Email from     : $($result.Email)" -ForegroundColor Green
} else {
    Write-Host "ERROR: update-user-pool failed." -ForegroundColor Red
    exit 1
}
