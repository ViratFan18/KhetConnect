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

## 📚 API Documentation (Swagger/OpenAPI)

**Interactive API docs available at:**
- Development: http://localhost:8080/api/v1/swagger-ui.html
- Production: https://api.khetconnect.com/api/v1/swagger-ui.html

**OpenAPI JSON Specification:**
- Development: http://localhost:8080/v3/api-docs
- Production: https://api.khetconnect.com/v3/api-docs

The API is fully documented with **Swagger/OpenAPI 3.0** annotations. Every endpoint includes:
- ✅ Operation description and summary
- ✅ Request body schema and examples
- ✅ Response types and status codes
- ✅ Authentication requirements
- ✅ Rate limiting information
- ✅ Try-it-out functionality for testing

See [SWAGGER_API_DOCUMENTATION.md](SWAGGER_API_DOCUMENTATION.md) for detailed usage guide.

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

## Production Deployment

### Status: ✅ PRODUCTION READY

This application is **production-ready** and can handle ~100 concurrent users.

### Quick Start (5 minutes)

```bash
# 1. Run deployment checklist
bash DEPLOYMENT_CHECKLIST.sh

# 2. Run automated deployment
bash deploy.sh

# 3. Follow PRODUCTION_DEPLOYMENT_GUIDE.md for detailed setup
```

### Key Production Features

✅ **Security**
- JWT authentication with 32-char secrets
- Rate limiting (20 req/min auth endpoints, 250 req/min general)
- CORS with configurable origins
- Security headers (CSP, HSTS, X-Frame-Options)
- Encrypted database credentials (env-based)

✅ **Performance**
- Connection pooling (HikariCP: 20 max connections)
- Request compression (Gzip)
- CDN-ready frontend (Netlify)
- Database query optimization

✅ **Reliability**
- Pessimistic locking for race conditions
- Unique constraints on critical data
- Cascade deletes for data consistency
- Health checks and monitoring

✅ **Scalability**
- Stateless JWT authentication
- Horizontal scaling ready
- Database connection pooling
- Frontend static hosting

### Deployment Platforms

| Component | Platform | Provider |
|-----------|----------|----------|
| Backend | Railway | Cloud.railway.app |
| Frontend | Netlify | netlify.com |
| Database | Neon | Neon.tech (PostgreSQL) |

### Deployment Checklist

Before deploying, complete:

1. **Prepare Secrets**
   ```bash
   # Generate JWT secret
   JWT_SECRET=$(openssl rand -base64 32)
   echo "JWT_SECRET_KEY=$JWT_SECRET"
   ```

2. **Setup Database**
   - Create PostgreSQL on Neon
   - Enable PostGIS extension
   - Run `schema.sql`

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required variables
   - Set production URLs

4. **Run Tests**
   ```bash
   mvn test  # Backend
   npm test  # Frontend
   ```

5. **Deploy**
   ```bash
   bash deploy.sh
   ```

### Detailed Deployment Guide

See **[PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)** for:
- Step-by-step Railway deployment
- Netlify configuration
- Environment variables setup
- Monitoring and alerts
- Load testing procedures
- Troubleshooting guide

### Monitoring & Support

- **Backend Logs**: Railway Dashboard → Logs
- **Frontend Logs**: Browser DevTools → Console
- **Database**: Neon Dashboard → Query Editor
- **Status**: https://status.railway.app (Railway status)

### Performance Metrics

**Expected Performance (100 concurrent users)**:
- Response time P95: < 500ms
- Error rate: < 0.1%
- API throughput: ~50-100 requests/sec
- Database connections: ~10-20 active

**Capacity Scaling**:
- 100 users: Current setup ✅
- 500 users: Increase HikariCP pool to 40, add caching
- 1000+ users: Add read replicas, implement CDN caching

### Infrastructure Costs

**Estimated Monthly Cost**:
- Railway Backend: $5-20 (depending on usage)
- Netlify Frontend: $0 (free tier sufficient)
- Neon Database: $5-15 (depending on usage)
- **Total: ~$10-35/month**

---

## License

MIT
