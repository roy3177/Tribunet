# Tribunet — רשימת משימות AWS

## ✅ מה עשינו עד עכשיו

- [x] פתחנו חשבון AWS (Free Tier)
- [x] הזנו פרטי כרטיס אשראי (לאימות זהות בלבד)
- [x] מילאנו את כל 3 שלבי ההרשמה
- [x] התחברנו לחשבון AWS בהצלחה
- [x] הגדרנו Billing Alert (הגנה מחיובים)

---

## 👉 הבא — שלב 1.2: יצירת IAM User

**למה?** אסור לעבוד עם חשבון ה-root לפיתוח — סיכון אבטחה.

### מה לעשות:
1. AWS Console → חפש **IAM** בסרגל החיפוש → Enter
2. בתפריט השמאלי: **Users** → **Create user**
3. שם משתמש: `tribunet-admin`
4. סמן: ✅ **Provide user access to the AWS Management Console**
5. לחץ **Next**
6. בחר: **Attach policies directly**
7. חפש וסמן: ✅ **AdministratorAccess**
8. לחץ **Next** → **Create user**
9. **חשוב מאוד:** לחץ **Download .csv** ושמור את הקובץ — יש בו Access Key + Secret Key

---

## 📋 שלב 1.3 — התקנת כלים על המחשב

אחרי שיצרת IAM User:

1. פתח **PowerShell** ורץ:
```
winget install Amazon.AWSCLI
winget install Amazon.SAM-CLI
```

2. אחרי ההתקנה, הרץ:
```
aws configure
```

3. הכנס את הפרטים מהקובץ שהורדת:
```
AWS Access Key ID: (מהקובץ)
AWS Secret Access Key: (מהקובץ)
Default region name: us-east-1
Default output format: json
```

---

## 📋 שלב 2 — יצירת שירותי AWS לפרויקט

### 2.1 Amazon Cognito (אימות משתמשים)
- [ ] AWS Console → **Cognito** → Create User Pool
- [ ] שם: `tribunet-user-pool`
- [ ] Sign-in: Email
- [ ] צור App Client: `tribunet-web-client`
- [ ] צור 2 Groups: `Admins` / `Users`
- [ ] **שמור:** User Pool ID + Client ID

### 2.2 Amazon Location Service (מפה)
- [ ] AWS Console → **Location Service** → Maps → Create Map
- [ ] שם: `tribunet-map`
- [ ] Style: `VectorEsriDarkGrayCanvas`
- [ ] צור Place Index: `tribunet-place-index`
- [ ] **שמור:** Map Name + Region

### 2.3 DynamoDB + S3 + Lambda
- [ ] יבוצע **אוטומטית** עם פקודת `sam deploy` בהמשך

---

## 📋 שלב 3 — פריסת הקוד ל-AWS

### 3.1 Deploy Backend
```bash
cd "Tribunet Project"
sam build
sam deploy --guided
```
- [ ] **שמור:** API Gateway URL שמוחזר בסוף

### 3.2 עדכון Frontend
- [ ] עדכן `frontend/.env`:
```
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
VITE_API_URL=...
VITE_LOCATION_MAP_STYLE_URL=...
```

### 3.3 Deploy Frontend ל-S3
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://tribunet-frontend
```

---

## 📋 שלב 4 — בדיקות
- [ ] נסה להירשם עם משתמש חדש
- [ ] נסה להתחבר
- [ ] נסה לפתוח את המפה
- [ ] נסה לפתוח את לוח הניהול עם Admin

---

## 🔑 מידע חשוב לשמור (מלא ברגע שיש)

| פרמטר | ערך |
|---|---|
| AWS Region | `us-east-1` |
| Cognito User Pool ID | _____________ |
| Cognito Client ID | _____________ |
| API Gateway URL | _____________ |
| S3 Bucket Name | `tribunet-frontend` |
| Location Map Name | `tribunet-map` |

---

## 📌 סטטוס קוד

- ✅ Phase 1 — Scaffolding
- ✅ Phase 2 — Login / Register / Home Page
- ✅ Phase 3 — מפה אינטראקטיבית
- ⏳ Phase 4 — Lambda Functions (Python)
- ⏳ Phase 5 — SAM Template (Infrastructure)
- ⏳ Phase 6 — Admin Dashboard
- ⏳ Phase 7 — UI Polish
- ⏳ Phase 8 — Documentation
