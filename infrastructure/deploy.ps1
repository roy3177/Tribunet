# Tribunet — Full Deployment Script
# Usage: Run this script from the infrastructure/ directory
# Prerequisites: AWS CLI configured, AWS SAM CLI installed, Python 3.11+

param(
    [string]$Stage = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tribunet Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: SAM Build ─────────────────────────────────────────────────────────
Write-Host "[1/4] Building Lambda functions..." -ForegroundColor Yellow

sam build --template sam-template.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: sam build failed. Check the output above." -ForegroundColor Red
    exit 1
}

Write-Host "      Build complete." -ForegroundColor Green
Write-Host ""

# ── Step 2: SAM Deploy ────────────────────────────────────────────────────────
Write-Host "[2/4] Deploying to AWS (Lambda, API Gateway, DynamoDB, IAM, CloudWatch)..." -ForegroundColor Yellow
Write-Host "      This may take 3-5 minutes..." -ForegroundColor Gray

sam deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: sam deploy failed. Check the output above." -ForegroundColor Red
    Write-Host "       Make sure samconfig.toml has your correct CognitoUserPoolId and CognitoClientId." -ForegroundColor Gray
    exit 1
}

Write-Host "      Deploy complete." -ForegroundColor Green
Write-Host ""

# ── Step 3: Seed Leagues ──────────────────────────────────────────────────────
Write-Host "[3/4] Seeding DynamoDB — 7 Israeli football leagues..." -ForegroundColor Yellow

python add_leagues.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: add_leagues.py failed. Check your AWS credentials and DynamoDB permissions." -ForegroundColor Red
    exit 1
}

Write-Host "      Leagues seeded." -ForegroundColor Green
Write-Host ""

# ── Step 4: Seed Teams ────────────────────────────────────────────────────────
Write-Host "[4/4] Seeding DynamoDB — 26 Israeli football teams..." -ForegroundColor Yellow

python add_teams.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: add_teams.py failed. Check your AWS credentials and DynamoDB permissions." -ForegroundColor Red
    exit 1
}

Write-Host "      Teams seeded." -ForegroundColor Green
Write-Host ""

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy the API URL from the Outputs section above" -ForegroundColor White
Write-Host "  2. Paste it into frontend/.env as VITE_API_URL" -ForegroundColor White
Write-Host "  3. Run: cd ../frontend && npm install && npm run build" -ForegroundColor White
Write-Host "  4. Follow README Step 5 to upload the frontend to S3" -ForegroundColor White
Write-Host ""
