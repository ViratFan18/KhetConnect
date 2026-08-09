# KhetConnect 🌾

Hyperlocal mobile-first web application connecting farmers with skilled agricultural labourers within a 5 km radius.

## Problem

Farmers in rural Andhra Pradesh struggle to find daily wage labourers during critical crop seasons. Labourers have no reliable way to discover nearby work opportunities.

## Solution

- Farmers post job requirements (crop, work type, wage, date, GPS location)
- Labourers within 5 km see nearby jobs instantly
- Direct call contact between farmer and labourer
- Work history and star rating system for trust building
- Bilingual UI (Telugu + English)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2, Java 17, JWT, Spring Security |
| Database | PostgreSQL / H2 (dev) |
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| i18n | i18next (Telugu + English) |

## Architecture

```
React PWA (Netlify) ──HTTPS──► Spring Boot REST API (Railway)
Spring Boot ──JDBC──► PostgreSQL (Neon)
```

## Local Development

### Backend

```bash
cd backend/backend
./mvnw spring-boot:run
```

API runs at `http://localhost:8080/api/v1`

Uses H2 in-memory database by default (no setup required).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

Set `VITE_API_BASE_URL=http://localhost:8080/api/v1` in `.env`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register farmer or labourer |
| POST | /auth/login | Login, returns JWT |
| GET | /auth/me | Current user profile |
| POST | /jobs | Farmer creates job |
| GET | /jobs/nearby | Labourer gets jobs within 5km |
| GET | /jobs/my-posts | Farmer's posted jobs |
| POST | /jobs/{id}/apply | Labourer applies |
| PUT | /jobs/{id}/complete | Mark job complete |
| POST | /ratings | Submit rating |
| GET | /history/farmer | Farmer job history |
| GET | /history/labourer | Labourer work history |

## Environment Variables

### Backend (Railway)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 32+ character secret
- `CORS_ALLOWED_ORIGINS` - Frontend URL

### Frontend (Netlify)
- `VITE_API_BASE_URL` - Backend API URL

## Deployment

- **Backend**: Railway with Dockerfile
- **Frontend**: Netlify (see `netlify.toml`)
- **Database**: Neon PostgreSQL (run `schema.sql`)

## License

MIT
