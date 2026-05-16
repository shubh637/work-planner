# Work Planner

Full-stack task management application. Manager assigns and approves tasks; team members mark progress. Email alerts on assignment.

## Tech Stack
- **Backend:** Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, MySQL 8, JavaMailSender
- **Frontend:** React 18, Vite, React Router v6, Axios

---

## Quick Start

### 1. Database Setup
```bash
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
cd work-planner-backend

# Edit src/main/resources/application.properties:
# - spring.datasource.username / password
# - spring.mail.username / password (Gmail App Password)

mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. Frontend
```bash
cd work-planner-frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

---

## Default Login
| Role    | Email                       | Password  |
|---------|-----------------------------|-----------|
| Admin | Admin@workplanner.com     | admin123  |

Register team members via **Team** page after logging in as manager.

---

## Email Alerts
Uses Gmail SMTP. To configure:
1. Enable 2FA on your Gmail account
2. Generate an App Password: Google Account → Security → App Passwords
3. Set in `application.properties`:
   ```
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-16-char-app-password
   ```

For local testing, use [Mailpit](https://github.com/axllent/mailpit):
```bash
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```
Then set `spring.mail.host=localhost` and `spring.mail.port=1025`.

---

## Features

### Manager
- Create/manage projects
- Add/remove team members
- Create tasks & assign directly to members (triggers email)
- Approve or reject member-suggested tasks
- Filter tasks by project / member / status / date
- View progress history per task
- Reports: tasks by status, by project, by member (CSV export)

### Team Member
- View assigned tasks (OPEN/IN_PROGRESS/CLOSED)
- Mark progress: Open → In Progress → Closed
- Suggest new tasks for manager approval

---

## Project Structure
```
work-planner/
├── schema.sql                   # MySQL schema
├── work-planner-backend/        # Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/workplanner/
│       ├── config/              # Security, CORS
│       ├── security/            # JWT filter + util
│       ├── entity/              # JPA entities
│       ├── repository/          # Spring Data repos
│       ├── dto/                 # Request/response DTOs
│       ├── service/             # Business logic
│       ├── controller/          # REST endpoints
│       └── exception/           # Error handling
└── work-planner-frontend/       # React app
    └── src/
        ├── api/                 # Axios + API calls
        ├── context/             # Auth state
        ├── routes/              # Protected/role routes
        ├── pages/manager/       # Manager UI pages
        ├── pages/member/        # Member UI pages
        └── components/          # Shared components
```
