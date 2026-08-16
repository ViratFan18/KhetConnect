# KhetConnect Deployment Checklist

## Pre-Deployment Verification

### Backend Application
- [ ] **Build succeeds**: `mvn clean package -DskipTests`
- [ ] **All tests pass**: `mvn test`
- [ ] **No compilation warnings or errors**
- [ ] **No hardcoded secrets in code** (check for API keys, passwords, database credentials)
- [ ] **Environment variables documented**: `.env.example` file created
- [ ] **Database migrations tested** locally with actual data volume
- [ ] **Spring Actuator enabled** for health checks: `management.endpoints.web.exposure.include=health,info`

### Frontend Application
- [ ] **Build succeeds**: `npm run build`
- [ ] **All tests pass**: `npm test -- --run`
- [ ] **No TypeScript errors or console warnings**
- [ ] **No hardcoded API URLs** (use environment variables: `VITE_API_URL`)
- [ ] **Bundle size acceptable** (main chunk <600KB gzip)
- [ ] **Assets optimized** (images compressed, lazy-loaded where applicable)

### Docker
- [ ] **Backend Dockerfile builds**: `docker build -t khetconnect-backend backend/backend`
- [ ] **Frontend Dockerfile builds**: `docker build -t khetconnect-frontend frontend`
- [ ] **docker-compose.yml tested locally**: `docker-compose up`
- [ ] **Health checks properly configured** for all services
- [ ] **Non-root users configured** in both Dockerfiles
- [ ] **Security context validated** (no privilege escalation, proper permissions)

---

## Production Deployment - Railway (Backend)

### 1. Environment Configuration
```bash
# Railway environment variables (set in Railway dashboard)
SPRING_PROFILES_ACTIVE=production
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_DATASOURCE_URL=postgresql://user:pass@host:5432/khetconnect
SPRING_DATASOURCE_USERNAME=${DB_USER}
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}

# Security
JWT_SECRET_KEY=${JWT_SECRET}  # Generate: openssl rand -base64 32
JWT_EXPIRATION_MS=86400000    # 24 hours

# Firebase
KHETCONNECT_FCM_ENABLED=true
GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json

# CORS Configuration
KHETCONNECT_CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_KHETCONNECT=INFO
LOGGING_FILE=/var/log/khetconnect/spring.log

# Server
SERVER_PORT=8080
SERVER_COMPRESSION_ENABLED=true
SERVER_COMPRESSION_MIN_RESPONSE_SIZE=1024
```

### 2. JVM Tuning (Railway Memory Limits)
```bash
# For 512MB container
JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# For 1GB container
JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# For 2GB container
JAVA_OPTS="-Xms1024m -Xmx2048m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### 3. Database Preparation
- [ ] **PostgreSQL instance provisioned** on Railway or external provider
- [ ] **Database created**: `CREATE DATABASE khetconnect;`
- [ ] **Backup strategy established** (daily automated backups enabled)
- [ ] **Connection pooling configured** (HikariCP):
  ```properties
  spring.datasource.hikari.maximum-pool-size=10
  spring.datasource.hikari.minimum-idle=2
  spring.datasource.hikari.connection-timeout=30000
  ```
- [ ] **Connection string securely stored** (Railway secrets)

### 4. Health Check Configuration
```bash
# Railway Health Check Settings
- Endpoint: /actuator/health
- Port: 8080
- Interval: 30s
- Timeout: 10s
- Grace Period: 60s
```

### 5. Deployment Process
1. Push code to Git repository
2. Railway automatically builds and deploys from `Dockerfile`
3. Monitor logs: `railway logs -f`
4. Verify health check passing: `curl https://your-app.railway.app/actuator/health`
5. Test API endpoints with production data

### 6. Cold Start Optimization
- ⚠️ **Expected startup time**: 30-45 seconds with H2, 15-25 seconds with PostgreSQL warmed up
- Use **Railway's wake-on-demand** feature instead of always-on for dev tier
- Monitor first request latency (may be delayed by Railway's infrastructure)

### 7. Monitoring & Alerts
- [ ] **Logs aggregation enabled** (Railway provides built-in logging)
- [ ] **Error tracking configured** (Sentry or similar - OPTIONAL for v1)
- [ ] **Database backups monitored** (daily email confirmations)
- [ ] **API response time alerts** (alert if >5s avg response)

---

## Production Deployment - Netlify (Frontend)

### 1. Environment Configuration
```bash
# Netlify Build Environment Variables
VITE_API_URL=https://your-api-domain.railway.app/api
VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}
VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
# ... other Firebase credentials from environment
```

### 2. Build Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Deployment Process
1. Connect GitHub repository to Netlify
2. Select branch to deploy: `main` or `production`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy on each push to selected branch

### 4. Domain & SSL
- [ ] **Custom domain configured** in Netlify dashboard
- [ ] **SSL certificate auto-renewed** (Netlify provides free Let's Encrypt)
- [ ] **HTTPS only enforced** (redirect HTTP → HTTPS)
- [ ] **DNS records pointing to Netlify nameservers**

### 5. CDN Caching
- [ ] **Static assets cached** (HTML: no-cache, JS/CSS: 1 year with versioning)
- [ ] **Cache invalidation** on deploy (Netlify automatic)
- [ ] **Preload critical resources** in index.html

### 6. Performance Optimization
- **Check Lighthouse score**: Target ≥80
- **Monitor Core Web Vitals**:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1

### 7. Security Headers
```
Netlify Config → Site Settings → Security:
- Content-Security-Policy: frame-ancestors 'none'
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
```

---

## Post-Deployment Verification

### Functional Testing
```bash
# Backend connectivity
curl https://your-api-domain.railway.app/actuator/health

# Frontend accessibility
curl https://your-domain.com/

# API authentication flow
curl -X POST https://your-api-domain.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "test@example.com", "password": "test123"}'
```

### Load Testing (Optional - for production confidence)
```bash
# Using Apache Bench
ab -n 100 -c 10 https://your-api-domain.railway.app/actuator/health

# Using hey
hey -n 1000 -c 50 https://your-domain.com/
```

### Monitoring Dashboard
- [ ] **Railway dashboard**: Monitor CPU, Memory, Disk usage
- [ ] **Netlify Analytics**: Monitor build times, deploy history
- [ ] **Application Logs**: Check for errors, warnings in real-time

---

## Rollback Procedure

### Backend (Railway)
1. Go to Railway Dashboard → Deployments
2. Select previous successful deployment
3. Click "Redeploy"
4. Verify health check passing
5. Monitor error logs for 5 minutes

### Frontend (Netlify)
1. Go to Netlify Dashboard → Deploys
2. Click on previous successful deploy
3. Click "Publish Deploy"
4. Verify site is accessible and functional
5. Check that API is responding correctly

---

## Performance Targets (SLA)

### Backend
- **Uptime**: 99.5% (≤3.6 hours downtime/month)
- **Response Time (P95)**: <500ms for API calls
- **Database Connections**: <50 concurrent (auto-scale with load)
- **Error Rate**: <0.1% (5XX errors)

### Frontend
- **Uptime**: 99.9% (Netlify SLA)
- **Page Load Time (P95)**: <3 seconds
- **Bundle Size**: <600KB gzip
- **Time to Interactive**: <5 seconds

---

## Known Issues & Workarounds

### Issue: Cold Start Delay
**Symptom**: First request after deploy takes 30-45s  
**Cause**: JVM startup time + Spring initialization  
**Workaround**: 
- Use production Postgres (faster than H2)
- Enable Railway's paid tier for faster containers
- Monitor logs for startup sequence

### Issue: Firebase Notifications Slow
**Symptom**: Push notifications delayed >10s  
**Cause**: Network latency or Firebase throttling  
**Workaround**:
- Implement async retry with exponential backoff (already done)
- Monitor Firebase quota in console
- Use background job processing if scaling needed

### Issue: CORS Errors on Frontend
**Symptom**: "Access-Control-Allow-Origin" error  
**Cause**: Backend CORS config mismatch  
**Workaround**:
- Verify `KHETCONNECT_CORS_ALLOWED_ORIGINS` includes frontend domain
- Check browser console for actual origin being used
- Redeploy backend after CORS config change

---

## Scaling Considerations (~100 concurrent users)

### Backend Scaling
- **Current capacity**: 1 Railway container (512MB) handles ~50-100 concurrent users
- **Scaling approach**: Increase container memory to 1-2GB
- **Database**: Ensure PostgreSQL connection pool sized for concurrent requests
- **Caching**: Redis could be added if GET requests become bottleneck

### Frontend Scaling
- **CDN**: Netlify Edge Functions for dynamic content (future optimization)
- **Bundle splitting**: Already using Vite chunking; no immediate changes needed
- **Image optimization**: Next.js Image component could replace manual img tags

### Database Scaling
- **Indexes**: Verify indexes on frequently queried columns:
  - `jobs(status, latitude, longitude, created_at)`
  - `job_applications(job_id, status)`
  - `ratings(rater_id, job_id)`
- **Query optimization**: Monitor slow queries with PostgreSQL logs
- **Read replicas**: Not needed until >500 concurrent users

---

## Security Checklist

- [ ] **Secrets never committed** (use environment variables)
- [ ] **HTTPS enforced** on all endpoints
- [ ] **JWT token expiration** set to 24 hours
- [ ] **Password reset tokens** have 1-hour expiration
- [ ] **Rate limiting** implemented on auth endpoints (future work)
- [ ] **SQL injection prevention** via parameterized queries (Spring Data)
- [ ] **CSRF protection** if needed for forms (Spring Security default)
- [ ] **XSS prevention** via Content-Security-Policy headers
- [ ] **Dependency vulnerabilities** checked: `npm audit`, `mvn dependency:check`

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs for critical issues
- [ ] Check database backup completed successfully
- [ ] Verify API response times within SLA

### Weekly
- [ ] Review application logs for warnings
- [ ] Check database query performance
- [ ] Verify all third-party services functional (Firebase, etc.)

### Monthly
- [ ] Update dependencies (security patches)
- [ ] Review and rotate secrets if needed
- [ ] Analyze usage patterns and performance metrics
- [ ] Plan next feature deployment

---

**Last Updated**: 2026-08-15  
**Status**: Ready for Production (~100 concurrent users)  
**Next Review**: Post-launch (1-2 weeks)
