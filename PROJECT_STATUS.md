# Tribunet — Project Status Report
# Tribunet — דוח מצב פרויקט

**Date / תאריך:** 13.05.2026  
**Team / קבוצה:** קבוצה Z — רואי מעודד, ירין קשת, תומר גל

---

## 🇮🇱 עברית

### מה עשינו עד כה

#### Frontend
- בנינו 10 דפים מלאים ב-React + Vite + Tailwind CSS + Framer Motion:
  - דף הבית, לוגין, הרשמה, מפה אינטראקטיבית, פרטי משחק
  - מועדפים, פרופיל משתמש, לוח ניהול, הוספת/עריכת משחק, ניהול אצטדיונים
- ניתוב מלא עם הגנות: ProtectedRoute, AdminRoute, GuestRoute
- AuthContext מחובר ל-AWS Cognito דרך AWS Amplify
- מפה אינטראקטיבית של ישראל עם react-map-gl
- Mock data fallback כשאין API

#### Backend
- 4 Lambda functions ב-Python:
  - `/matches` — GET, POST, PUT, DELETE
  - `/stadiums` — GET, POST, PUT, DELETE
  - `/favorites` — GET, POST, DELETE
  - `/users` — GET
- `shared/auth.py` — וולידציה של JWT מ-Cognito
- `shared/db.py` — פונקציות עזר ל-DynamoDB
- `shared/response.py` — פורמט תגובה אחיד

#### Infrastructure
- SAM template עם כל המשאבים
- 6 טבלאות DynamoDB
- API Gateway HTTP API
- IAM Role עם הרשאות מינימליות
- Cognito JWT Authorizer

#### AWS Deployment — מה שפרסנו
- ✅ Backend פרוס ועובד — API Gateway + Lambda + DynamoDB
- ✅ Frontend פרוס ב-S3
- ✅ CloudFront מוגדר עם HTTPS
- ✅ Cognito User Pool פעיל — הרשמה ולוגין עובדים
- ✅ Admin User מוגדר

#### באגים שתיקנו
- SAM CLI לא זוהה ב-PowerShell — עברנו ל-CMD
- Python 3.11 לא קיים — עדכנו ל-3.13 ב-SAM template
- IAM user חסר הרשאות — הוספנו 7 policies
- Client ID שגוי ב-Cognito — תוקן (1 ↔ l)
- מדיניות סיסמה לא תואמת — הוספנו בדיקת אות קטנה ותו מיוחד
- Float types לא נתמכים ב-DynamoDB — המרנו ל-Decimal
- Token audience לא תואם ב-API Gateway — פרסנו מחדש עם ID הנכון

---

### מה נשאר לעשות

#### 🔴 דחוף — האתר לא שמיש בלעדיהם
| # | משימה | תיאור |
|---|---|---|
| 1 | **הוספת אצטדיונים** | להוסיף 6 אצטדיונים דרך לוח הניהול |
| 2 | **הוספת משחקים** | להוסיף משחקים לדוגמה — המפה ריקה |
| 3 | **Cognito Post-Confirmation Trigger** | Lambda שישמור משתמשים ב-DynamoDB אוטומטית |

#### 🟡 חשוב — נדרש לפי המסמך
| # | משימה | תיאור |
|---|---|---|
| 4 | **Amazon Location Service** | להחליף את המפה מ-OpenFreeMap ל-AWS |
| 5 | **EventBridge Scheduled Rule** | עדכון אוטומטי של נתוני משחקים |
| 6 | **CloudWatch Alarms** | התראות על שגיאות ב-Lambda |
| 7 | **CloudFront Cache Invalidation** | אוטומציה בכל deploy |

#### 🟢 תיעוד
| # | משימה |
|---|---|
| 8 | Swagger / OpenAPI documentation |
| 9 | מדריך משתמש + מדריך אדמין |
| 10 | ניתוח סיכונים + הערכת עלויות AWS |
| 11 | הוראות התקנה |

---

## 🇺🇸 English

### What We Have Done

#### Frontend
- Built 10 full pages using React + Vite + Tailwind CSS + Framer Motion:
  - Home, Login, Register, Interactive Map, Match Details
  - Favorites, User Profile, Admin Dashboard, Add/Edit Match, Stadium Management
- Full routing with guards: ProtectedRoute, AdminRoute, GuestRoute
- AuthContext connected to AWS Cognito via AWS Amplify
- Interactive map of Israel using react-map-gl / MapLibre
- Mock data fallback when API is unavailable

#### Backend
- 4 Lambda functions in Python:
  - `/matches` — GET, POST, PUT, DELETE
  - `/stadiums` — GET, POST, PUT, DELETE
  - `/favorites` — GET, POST, DELETE
  - `/users` — GET
- `shared/auth.py` — Cognito JWT validation
- `shared/db.py` — DynamoDB helper utilities
- `shared/response.py` — Consistent API response format

#### Infrastructure
- SAM template defining all AWS resources
- 6 DynamoDB tables (matches, stadiums, favorites, users, teams, leagues)
- API Gateway HTTP API with Cognito JWT authorizer
- IAM Role with least-privilege DynamoDB access

#### AWS Deployment — What Is Live
- ✅ Backend deployed — API Gateway + Lambda + DynamoDB
- ✅ Frontend hosted on S3
- ✅ CloudFront distribution configured with HTTPS
- ✅ Cognito User Pool active — registration and login working
- ✅ Admin user configured

#### Bugs Fixed
- SAM CLI not recognized in PowerShell — switched to CMD
- Python 3.11 not installed — updated runtime to 3.13 in SAM template
- IAM user missing permissions — added 7 required policies
- Wrong Cognito Client ID (digit 1 vs letter l) — corrected in `.env` and redeployed
- Password policy mismatch — added lowercase and special character validation to frontend
- DynamoDB Float type error — converted lat/lng to Decimal in stadiums Lambda
- Token audience mismatch in API Gateway — redeployed with correct Client ID

---

### What Remains To Be Done

#### 🔴 Critical — Site Is Not Functional Without These
| # | Task | Description |
|---|---|---|
| 1 | **Add Stadiums** | Add 6 stadiums via Admin Dashboard |
| 2 | **Add Matches** | Add sample matches so the map displays data |
| 3 | **Cognito Post-Confirmation Trigger** | Lambda to auto-save users to DynamoDB on signup |

#### 🟡 Important — Required by Project Document
| # | Task | Description |
|---|---|---|
| 4 | **Amazon Location Service** | Replace OpenFreeMap with AWS Location Service for the map |
| 5 | **EventBridge Scheduled Rule** | Automatic match data refresh |
| 6 | **CloudWatch Alarms** | Error alerts on Lambda failures |
| 7 | **CloudFront Cache Invalidation** | Automate cache clearing on every deploy |

#### 🟢 Documentation
| # | Task |
|---|---|
| 8 | Swagger / OpenAPI documentation |
| 9 | User guide + Admin guide |
| 10 | Risk analysis + AWS cost estimation |
| 11 | Installation instructions |

---

## AWS Services Status

| Service | Purpose | Status |
|---|---|---|
| Amazon S3 | Frontend hosting | ✅ Live |
| Amazon CloudFront | CDN + HTTPS | ✅ Live |
| Amazon API Gateway | API layer | ✅ Live |
| AWS Lambda (Python) | Business logic | ✅ Live |
| Amazon DynamoDB | Database | ✅ Live (empty) |
| Amazon Cognito | Authentication | ✅ Live |
| AWS IAM | Permissions | ✅ Configured |
| Amazon Location Service | Map tiles | ❌ Not implemented |
| Amazon EventBridge | Scheduled updates | ❌ Not implemented |
| Amazon CloudWatch | Monitoring & logs | ⚠️ Logs only, no alarms |

---

## Live URLs

| Resource | URL |
|---|---|
| Website (CloudFront) | https://d3qx6x8ydteha.cloudfront.net |
| API Gateway | https://3mijm4cjad.execute-api.us-east-1.amazonaws.com/prod |
