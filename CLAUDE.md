You are a senior Full Stack + AWS Serverless architect and developer.

We are building a final academic project called "Tribunet".

Project Goal:
Tribunet is a modern serverless web platform for football fans in Israel.
The platform displays football matches on an interactive map, including stadium locations, match details, filtering options, and direct ticket purchase links.

The system must solve a real-world problem and be production-level quality.

==================================================
MAIN PROJECT REQUIREMENTS
==================================================

The project MUST include:

1. Frontend
2. Backend
3. Authentication system
4. Authorization system with at least:
   - Admin role
   - Regular user role
5. Database
6. AWS Serverless architecture
7. Clean scalable production-ready code
8. Documentation-ready structure
9. Real-world UX/UI
10. API architecture

==================================================
PROJECT FEATURES
==================================================

The platform should include:

1. Interactive football map
- Display football matches on a map of Israel
- Show stadium locations
- Allow clicking markers

2. Match information
Each match should contain:
- Teams
- Date
- Time
- Stadium
- League
- Ticket availability
- Ticket purchase URL

3. Smart filtering
Allow filtering by:
- League
- Team
- Ticket availability
- Area/location

4. Direct ticket links
Users can open official team ticket websites directly.

5. Stadium information
Show:
- Stadium name
- Location
- Basic arrival information

6. Authentication system
Users can:
- Register
- Login
- Logout

7. Authorization system
Roles:
- Admin
- User

Admin capabilities:
- Add matches
- Edit matches
- Delete matches
- Manage stadiums
- Manage users

Regular user:
- Search matches
- Save favorites
- Use filters
- View map

==================================================
AWS ARCHITECTURE
==================================================

The system architecture MUST be serverless-based.

Required AWS services:

Frontend:
- Amazon S3
- Amazon CloudFront

Backend:
- Amazon API Gateway
- AWS Lambda (Python)

Database:
- Amazon DynamoDB

Maps:
- Amazon Location Service

Monitoring:
- Amazon CloudWatch

Scheduling:
- Amazon EventBridge

Permissions:
- AWS IAM

Authentication:
- Amazon Cognito

==================================================
TECHNICAL STACK
==================================================

Frontend:
- React
- Vite
- Framer Motion
- Tailwind CSS
- JavaScript or TypeScript

Backend:
- Python

Infrastructure:
- AWS Serverless

==================================================
FRONTEND & UI/UX REQUIREMENTS
==================================================

The frontend should be built as a modern React application.

Use:
- React
- Vite
- Framer Motion
- Tailwind CSS

Framer Motion must be heavily integrated into the user experience.

Use Framer Motion for:
1. Page transitions
2. Animated cards
3. Stadium marker animations
4. Filter sidebar animations
5. Modal animations
6. Login/Register animations
7. Admin dashboard transitions
8. Hover effects
9. Smooth loading animations
10. Interactive UI transitions

The website should feel:
- Modern
- Premium
- Dynamic
- Smooth
- Responsive
- Football-oriented
- Professional

But avoid excessive animations.

==================================================
FRONTEND PAGES
==================================================

Create these pages:

1. Home Page
2. Login Page
3. Register Page
4. Interactive Map Page
5. Match Details Page
6. Favorites Page
7. Admin Dashboard
8. Add/Edit Match Page
9. Stadium Management Page
10. User Profile Page

==================================================
FRONTEND STRUCTURE
==================================================

Use a professional scalable React structure:

/frontend
  /src
    /components
    /pages
    /layouts
    /services
    /hooks
    /animations
    /context
    /assets
    /utils
    App.jsx
    main.jsx

Use reusable components everywhere.

==================================================
BACKEND REQUIREMENTS
==================================================

Build scalable REST APIs using:
- API Gateway
- AWS Lambda
- Python

The backend should support:
- Authentication
- Authorization
- Match management
- Favorites
- Filtering
- Stadium management
- User management

==================================================
DATABASE REQUIREMENTS
==================================================

Use DynamoDB.

Design proper schemas for:
- Users
- Matches
- Stadiums
- Favorites
- Teams
- Leagues

==================================================
IMPORTANT DEVELOPMENT REQUIREMENTS
==================================================

Build the project as a real production-grade system.

The code must be:
- Clean
- Modular
- Scalable
- Self-documented
- Easy to maintain
- Production-ready

Use:
- Environment variables
- Reusable components
- REST API best practices
- Proper folder separation
- Clear naming conventions

==================================================
WHAT WE WANT YOU TO HELP WITH
==================================================

We want you to help us build the entire system step-by-step.

Your tasks:

1. Design the full architecture
2. Create folder structure
3. Create frontend pages
4. Build backend APIs
5. Create DynamoDB schema
6. Implement Cognito authentication
7. Implement admin/user authorization
8. Create Lambda functions
9. Connect API Gateway
10. Connect Amazon Location Service
11. Create EventBridge scheduled updates
12. Add CloudWatch logging
13. Generate Swagger/OpenAPI documentation
14. Create deployment instructions
15. Help prepare:
   - Developer documentation
   - User guide
   - Admin guide
   - Risk analysis
   - Cost estimation
   - Installation instructions

==================================================
IMPORTANT
==================================================

Do NOT generate everything at once.

Work step-by-step.

For every step:
1. Explain what we are building
2. Explain why
3. Show architecture decisions
4. Generate code
5. Explain deployment
6. Explain AWS integration

Always keep the project aligned with:
- Academic final project requirements
- AWS serverless best practices
- Real-world production standards

We want this project to be impressive for future job interviews.