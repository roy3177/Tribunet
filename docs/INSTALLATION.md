# Tribunet — Installation & Deployment Guide

This guide walks a technical person through deploying the full Tribunet system from scratch in a new AWS account.

---

## Prerequisites

Install and configure the following tools before starting:

| Tool | Version | Install |
|---|---|---|
| AWS CLI | 2.x | https://aws.amazon.com/cli/ |
| AWS SAM CLI | latest | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |
| Node.js | 18+ | https://nodejs.org/ |
| Python | 3.11+ | https://www.python.org/ |

Configure your AWS credentials:
```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

> The AWS IAM user must have permissions for: Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront, CloudWatch, SNS, EventBridge, IAM.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/roy3177/Tribunet.git
cd Tribunet
```

---

## Step 2 — Create a Cognito User Pool

1. Go to **AWS Console → Cognito → Create user pool**

2. **Authentication providers**
   - Cognito user pool sign-in options: check **Email**
   - Click **Next**

3. **Configure security requirements**
   - Password policy: **Cognito defaults** (leave as is)
   - MFA: **No MFA**
   - Click **Next**

4. **Configure sign-up experience**
   - Self-registration: **Enable**
   - Required attributes: add **`name`** (click "Add attribute" → select `name`)
   - Click **Next**

5. **Configure message delivery**
   - Email provider: **Send email with Cognito** (free, for testing)
   - Click **Next**

6. **Integrate your app**
   - User pool name: `tribunet-user-pool`
   - App client name: `tribunet-client`
   - ⚠️ **Uncheck "Generate a client secret"** — the frontend SDK does not support client secrets
   - Click **Next**

7. **Review and create** → click **Create user pool**

8. **Copy your credentials** (you will need these in Step 3):
   - **User Pool ID** — shown on the User Pool page (format: `us-east-1_XXXXXXXXX`)
   - **Client ID** — go to **App integration → App clients** → copy the Client ID

9. **Update `infrastructure/samconfig.toml`** with your values:
   ```toml
   parameter_overrides = "CognitoUserPoolId=\"us-east-1_XXXXXXXXX\" CognitoClientId=\"YOUR_CLIENT_ID\" Stage=\"prod\""
   ```

---

## Step 3 — Deploy the Backend

Run the unified deployment script from the `infrastructure/` directory:

```powershell
cd infrastructure
.\deploy.ps1
```

This script automatically runs:
1. `sam build` — packages all Lambda functions
2. `sam deploy` — creates all AWS resources (Lambda, API Gateway, DynamoDB, IAM, CloudWatch)
3. `python add_leagues.py` — seeds 7 Israeli football leagues
4. `python add_teams.py` — seeds 26 Israeli football teams

After deployment completes, copy the **API Gateway URL** from the Outputs section:
```
Outputs:
  ApiUrl: https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
```

> **Note:** SAM will send a confirmation email to the alert addresses configured in `samconfig.toml` — confirm the subscription to activate CloudWatch alerts.

---

## Step 4 — Deploy the Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your values:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-app-client-id
VITE_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_LOCATION_MAP_NAME=tribunet-map
VITE_LOCATION_PLACE_INDEX=tribunet-place-index
VITE_LOCATION_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/dark
```

Build and upload to S3:

```bash
npm install
npm run build

# Create S3 bucket (choose a globally unique name)
aws s3 mb s3://YOUR-BUCKET-NAME --region us-east-1

# Upload build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete

# Enable static website hosting
aws s3 website s3://YOUR-BUCKET-NAME --index-document index.html --error-document index.html
```

Apply the bucket policy (allows public read):

```bash
aws s3api put-bucket-policy \
  --bucket YOUR-BUCKET-NAME \
  --policy file://bucket-policy.json
```

> Edit `frontend/bucket-policy.json` first — replace `tribunet-frontend-prod` with your actual bucket name.

---

## Step 5 — Set Up CloudFront

1. Go to **AWS Console → CloudFront → Create distribution**
2. Origin domain: select your S3 bucket
3. Default root object: `index.html`
4. Error pages: 403 and 404 → return `/index.html` with status 200 (required for React Router)
5. Create the distribution and wait ~5 minutes for it to deploy
6. Copy the **CloudFront domain** (e.g. `dXXXXXXXXXX.cloudfront.net`)

Update `frontend/.env` with the CloudFront URL, then rebuild:

```bash
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

---

## Step 6 — Set Up Amazon Location Service

1. Go to **AWS Console → Amazon Location Service → Maps → Create map**
   - Name: `tribunet-map`
   - Style: Esri Light (or Dark)
2. Go to **Place indexes → Create place index**
   - Name: `tribunet-place-index`
   - Provider: Esri
3. Add map/place index permissions to the Lambda IAM role in the SAM stack

---

## Step 7 — Set the First Admin User

1. Open the app at your CloudFront URL and register a new account
2. Go to **AWS Console → DynamoDB → Tables → tribunet-users-prod → Explore items**
3. Find your user record
4. Edit the `role` attribute: change `"user"` → `"admin"`
5. Save — you can now access the Admin Dashboard in the app

---

## Environment Variables Reference

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID (`us-east-1_XXXXXXX`) |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID |
| `VITE_API_URL` | API Gateway base URL (from SAM outputs) |
| `VITE_AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `VITE_LOCATION_MAP_NAME` | Amazon Location Service map name |
| `VITE_LOCATION_PLACE_INDEX` | Amazon Location Service place index name |
| `VITE_LOCATION_MAP_STYLE_URL` | Map tile style URL |

### `backend/.env` (local testing only)

Lambda functions receive all environment variables automatically from the SAM template. This file is only needed if running Lambda handlers locally.

| Variable | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `COGNITO_USER_POOL_ID` | your User Pool ID |
| `COGNITO_CLIENT_ID` | your App Client ID |
| `DYNAMODB_USERS_TABLE` | `tribunet-users-prod` |
| `DYNAMODB_MATCHES_TABLE` | `tribunet-matches-prod` |
| `DYNAMODB_STADIUMS_TABLE` | `tribunet-stadiums-prod` |
| `DYNAMODB_FAVORITES_TABLE` | `tribunet-favorites-prod` |
| `DYNAMODB_TEAMS_TABLE` | `tribunet-teams-prod` |
| `DYNAMODB_LEAGUES_TABLE` | `tribunet-leagues-prod` |
| `FRONTEND_URL` | your CloudFront URL |

---

## Verify Installation

After completing all steps, confirm the following:

- [ ] CloudFront URL loads the home page
- [ ] Registration and login work (email confirmed via Cognito)
- [ ] Map page displays stadiums and matches
- [ ] Filters work (by league, team, ticket availability)
- [ ] Favorites: add and remove a match
- [ ] Admin Dashboard is accessible after setting `role = "admin"`
- [ ] Admin can add, edit, and delete a match
- [ ] CloudWatch: Lambda invocation logs appear under `/aws/lambda/tribunet-*`
- [ ] SNS: CloudWatch alarm notifications arrive by email on threshold breach

---

## Troubleshooting

**Frontend shows blank page or 403**
→ Check the S3 bucket policy allows `s3:GetObject` for `*`. Confirm CloudFront error pages return `/index.html` with HTTP 200.

**Login fails / "User does not exist"**
→ Verify `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` in `frontend/.env` match the User Pool you created.

**API returns 401 Unauthorized**
→ The JWT token is missing or expired. Check the frontend is sending the `Authorization: Bearer <token>` header. Confirm the Cognito authorizer in API Gateway uses the correct User Pool ID and Client ID.

**Lambda returns 500 Internal Server Error**
→ Open CloudWatch → Log groups → `/aws/lambda/tribunet-<function-name>` and read the error. Most common cause: missing environment variable or DynamoDB permission denied.

**DynamoDB permission denied**
→ The Lambda IAM role (`LambdaRole` in the SAM template) must have `dynamodb:*` on the `tribunet-*` tables. Re-run `sam deploy` to apply IAM changes.

**Map does not load**
→ Verify `VITE_LOCATION_MAP_NAME` matches the map name in Amazon Location Service. The IAM policy on Lambda must include `geo:GetMap*` and `geo:SearchPlaceIndex*`.
