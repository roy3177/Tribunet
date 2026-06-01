# Tribunet – הסבר ארכיטקטורה טכנית

---

## סקירה כללית

Tribunet היא פלטפורמת ווב serverless לאוהדי כדורגל בישראל, הבנויה כולה על שירותי AWS מנוהלים.
הארכיטקטורה מבוססת על עיקרון **Serverless-First**: אין שרתים לניהול, הקוד רץ לפי דרישה, והעלות פרופורציונלית לשימוש בלבד.

המערכת בנויה משלוש שכבות:

| שכבה | שירות AWS | תפקיד |
|---|---|---|
| Frontend | S3 + CloudFront | הגשת אפליקציית React סטטית |
| API + Compute | API Gateway + Lambda | לוגיקה עסקית ו-REST API |
| Data | DynamoDB | מסד נתונים NoSQL מנוהל |

---

## רכיבי המערכת

### Frontend – S3 + CloudFront
קבצי ה-Build של React מאוחסנים ב-S3. CloudFront מגיש אותם דרך HTTPS מנקודת Edge קרובה למשתמש, ומספק תעודת SSL ו-Cache אוטומטי. אין שרת ווב לניהול.

### אימות – Amazon Cognito
Cognito מנהל רישום, התחברות ואישור מייל. לאחר התחברות מוצלחת הוא מנפיק JWT Token. בעת רישום חדש, Cognito מפעיל **PostConfirmation Trigger** שמפעיל Lambda ליצירת רשומת משתמש ב-DynamoDB עם Role ברירת מחדל `"user"`.

### API – API Gateway (HTTP API)
שער כניסה יחיד לכל בקשות ה-REST. לכל בקשה נבדק ה-JWT מול Cognito לפני הניתוב ל-Lambda. בקשות ללא Token תקין מקבלות `401 Unauthorized` מיידית.

### Compute – AWS Lambda (×8 Functions)
כל פונקציה כתובה ב-Python ואחראית על דומיין ספציפי:

| פונקציה | טריגר | אחריות |
|---|---|---|
| Matches | API Gateway | CRUD משחקים + סינון |
| Stadiums | API Gateway | ניהול אצטדיונים |
| Leagues / Teams | API Gateway | קבלת נתוני ליגות וקבוצות |
| Favorites | API Gateway | ניהול מועדפים לפי משתמש |
| Users | API Gateway | ניהול משתמשים (Admin בלבד) |
| CognitoTrigger | Cognito Event | יצירת משתמש ב-DynamoDB לאחר רישום |
| Scheduler | EventBridge | עדכון סטטוס משחקים + דוח שבועי |

### Database – DynamoDB (×6 Tables)
טבלאות: `matches`, `stadiums`, `users`, `favorites`, `teams`, `leagues`.
הגישה מוגנת ב-IAM Role ייעודי לכל Lambda – ללא סיסמאות או Connection Strings.

### מפה – Amazon Location Service
מספק Map Tiles לאפליקציה. הדפדפן מבקש את אריחי המפה ישירות עם API Key מוגבל, בעוד שקואורדינטות האצטדיונים נשלפות מ-DynamoDB ומוצגות כ-Markers על המפה.

### תזמון – EventBridge
Cron שבועי מנוהל שמפעיל את Lambda `Scheduler` אוטומטית, ללא תלות בפעילות משתמשים.

### ניטור – CloudWatch + SNS
CloudWatch אוסף Logs ו-Metrics מכל Lambda ו-API Gateway ומפעיל 10 Alarms מוגדרים.
SNS מקבל התראות מ-CloudWatch ודוחות מה-Scheduler, ומעביר אותם למייל Admin.

---

## זרימת נתונים – End to End

**משתמש רגיל – צפייה במשחקים:**
```
Browser → CloudFront/S3 (טעינת React)
Browser → Cognito (Login → JWT)
Browser → API Gateway (GET /matches + JWT)
API Gateway → Cognito (אימות JWT) → Lambda: Matches
Lambda → DynamoDB → תשובה → Browser
Browser → Amazon Location Service (Map Tiles)
```

**Admin – הוספת משחק:**
```
Browser → API Gateway (POST /matches + JWT Admin)
API Gateway → Cognito (אימות) → Lambda: Matches
Lambda (בדיקת Role="admin" מה-JWT)
Lambda → DynamoDB (Write) → 201 Created → Browser
```

**רישום משתמש חדש:**
```
Browser → Cognito (Register + אישור מייל)
Cognito → Lambda: CognitoTrigger (PostConfirmation)
Lambda → DynamoDB: users (יצירת רשומה, Role="user")
```

---

## עקרונות ארכיטקטוניים

| עיקרון | יישום |
|---|---|
| Serverless | Lambda + DynamoDB – אין שרתים לניהול |
| Least Privilege | IAM Role מינימלי לכל Lambda |
| Stateless | כל State מאוחסן ב-DynamoDB בלבד |
| Scalability | Lambda ו-DynamoDB מתרחבים אוטומטית לפי עומס |
| Security | HTTPS בלבד, JWT Authentication, IAM Authorization |
| Observability | CloudWatch Logs + Alarms + SNS Email Alerts |
