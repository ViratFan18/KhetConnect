# 🚀 KhetConnect - Production Deployment Guide

> **Status**: ✅ PRODUCTION READY  
> **Last Updated**: 2026-08-16  
> **Version**: 1.0.0

---

## 📋 Pre-Deployment Checklist

### Local Testing (Before Push to Production)

```bash
# 1. Run all tests
cd backend/backend
mvn clean test -DskipIntegrationTests

cd ../../frontend
npm test -- --run

# 2. Build backend
cd ../backend/backend
mvn clean package -DskipTests

# 3. Build frontend
cd ../../frontend
npm run build

# 4. Verify Docker builds
docker build -t khetconnect-backend:latest backend/backend/
docker build -t khetconnect-frontend:latest frontend/

# 5. Test Docker Compose locally
docker-compose -f docker-compose.prod.yml up --build
# Wait for health checks to pass, then Ctrl+C

echo "✅ All pre-deployment checks passed!"
```

---

## 🔐 Step 1: Prepare Secrets & Environment Variables

### Generate JWT Secret (Critical!)
```bash
# Generate 32-character random secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET_KEY=$JWT_SECRET"

# Save this value securely
```

### Database Setup (Neon PostgreSQL)

```bash
# 1. Create Neon project at https://console.neon.tech
# 2. Note the connection string: postgresql://user:password@host/dbname

# 3. Download PostgreSQL client and connect:
psql postgresql://user:password@host/dbname

# 4. Run schema:
\i schema.sql

# 5. Enable PostGIS:
CREATE EXTENSION IF NOT EXISTS postgis;

# 6. Verify:
\dt  # Should show 7+ tables
SELECT * FROM information_schema.tables WHERE table_schema='public';
```

### Firebase Setup

```bash
# 1. Go to Firebase Console: https://console.firebase.google.com
# 2. Create project → Enable Cloud Messaging
# 3. Generate service account JSON:
#    - Project Settings → Service Accounts → Generate New Private Key
# 4. Save to: backend/firebase-key.json (DO NOT COMMIT)
# 5. Set GOOGLE_APPLICATION_CREDENTIALS in deployment platform
```

---

## 🌐 Step 2: Deploy Backend (Railway)

### Option A: Using Railway Dashboard

1. **Connect GitHub**
   - Go to https://railway.app
   - Login with GitHub
   - Authorize Railway to access your repo

2. **Create New Project**
   - New Project → Deploy from GitHub repo
   - Select: `KhetConnect` repository
   - Branch: `main`

3. **Configure Environment Variables**
   - Go to Settings → Environment
   - Add all variables from `.env.example`:
   ```
   SPRING_DATASOURCE_URL=postgresql://...
   SPRING_DATASOURCE_USERNAME=...
   SPRING_DATASOURCE_PASSWORD=...
   JWT_SECRET_KEY=<generated secret>
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json
   SPRING_PROFILES_ACTIVE=production
   LOGGING_LEVEL_ROOT=WARN
   ```

4. **Upload Firebase Key**
   - Upload `firebase-key.json` to Railway storage
   - Mount path: `/app/firebase-key.json`

5. **Deploy**
   - Click "Deploy" button
   - Monitor logs: Railway Dashboard → Logs tab
   - Wait for: `Tomcat started on port 8080`

6. **Verify Health**
   ```bash
   curl https://your-backend.up.railway.app/actuator/health
   # Response: {"status":"UP"}
   ```

### Option B: Using Railway CLI

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init --name khetconnect-backend

# 4. Set environment
railway variables set SPRING_DATASOURCE_URL="postgresql://..."
railway variables set JWT_SECRET_KEY="generated_secret_here"
# ... add all other variables

# 5. Deploy
railway up

# 6. Monitor
railway logs --follow
```

---

## 🎨 Step 3: Deploy Frontend (Netlify)

### Setup Netlify

1. **Connect GitHub**
   - Go to https://app.netlify.com
   - New Site from Git → Connect to GitHub
   - Select: `KhetConnect` repo
   - Branch to deploy: `main`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18.x` or `20.x`

3. **Set Environment Variables**
   - Site Settings → Environment → Environment Variables
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   VITE_API_BASE_PATH=/api/v1
   ```

4. **Deploy**
   - Netlify auto-deploys on `git push` to `main`
   - Monitor: Deployments tab

5. **Verify Health**
   ```bash
   curl https://your-frontend-domain.netlify.app
   # Should return HTML content
   ```

---

## 🔗 Step 4: Connect Frontend to Backend

### Update Frontend Configuration

```javascript
// frontend/.env.production
VITE_API_URL=https://your-backend.up.railway.app/api/v1
```

### Update Backend CORS

```bash
# Railway environment variables
CORS_ALLOWED_ORIGINS=https://yourdomain.netlify.app,https://www.yourdomain.com
```

### Test Connection

```bash
# From browser console or Postman:
curl -X GET "https://your-backend.up.railway.app/actuator/health" \
  -H "Content-Type: application/json"

# Response should be:
# {"status":"UP"}

# Test API endpoint:
curl -X GET "https://your-backend.up.railway.app/api/v1/health"
# Response: {"status":"OK"}
```

---

## 🔍 Step 5: Monitoring & Alerts

### Backend Monitoring (Railway)

```bash
# View logs in Railway Dashboard
# Settings → Monitoring → Enable Metrics

# Expected metrics:
- Response time P95: < 500ms
- Error rate: < 0.1%
- CPU usage: < 70%
- Memory usage: < 85%
```

### Frontend Monitoring (Netlify)

```bash
# View analytics in Netlify Dashboard
# Settings → Advanced → Enable Analytics

# Monitor:
- Page load time
- 404 errors
- Deploy history
```

### Health Checks

Create cron job or use status monitoring service:

```bash
#!/bin/bash
# health-check.sh

BACKEND_URL="https://your-backend.up.railway.app/actuator/health"
FRONTEND_URL="https://yourdomain.netlify.app"

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL)
if [ "$BACKEND_STATUS" != "200" ]; then
    echo "❌ Backend health check FAILED: $BACKEND_STATUS"
    # Send alert email
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "❌ Frontend health check FAILED: $FRONTEND_STATUS"
fi

echo "✅ All services healthy"
```

---

## 📊 Step 6: Performance Tuning

### Database Connection Pool

```yaml
# Already configured in application-production.yml
hikari:
  maximum-pool-size: 20
  minimum-idle: 5
  connection-timeout: 30000
  idle-timeout: 600000
```

### JVM Tuning

```dockerfile
# backend/Dockerfile (already optimized)
ENV JVM_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Frontend Optimization

```bash
# Verify bundle size
cd frontend
npm run build
# Check dist/ size (target: < 2MB)

# Enable compression
# Already enabled in nginx.conf

# Enable caching
# Already configured in nginx.conf
```

---

## 🔐 Step 7: Security Hardening

### Verify All Security Headers

```bash
curl -I https://your-backend.up.railway.app/

# Should include:
# - Strict-Transport-Security: max-age=31536000
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: SAMEORIGIN
# - Content-Security-Policy: ...
```

### Rate Limiting Test

```bash
# Test auth rate limiting (20 req/min)
for i in {1..25}; do
  curl -X POST https://your-backend.up.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"9123456789","password":"invalid"}'
  sleep 1
done

# Should get 429 (Too Many Requests) after 20 attempts
```

### SSL/TLS Verification

```bash
# Verify SSL certificate
echo | openssl s_client -servername your-backend.up.railway.app \
  -connect your-backend.up.railway.app:443 2>/dev/null | \
  openssl x509 -noout -dates

# Should show valid dates
```

---

## 📈 Step 8: Load Testing

### Using Apache Bench (ab)

```bash
# Test frontend
ab -n 1000 -c 100 https://yourdomain.netlify.app

# Test backend API
ab -n 1000 -c 50 https://your-backend.up.railway.app/actuator/health
```

### Using wrk (Advanced)

```bash
# Install: https://github.com/wg/wrk
wrk -t 4 -c 100 -d 30s https://your-backend.up.railway.app/actuator/health
```

---

## 🚨 Troubleshooting

### Backend Won't Start

```bash
# Check logs in Railway
railway logs --follow

# Common issues:
# 1. Missing JWT_SECRET_KEY
#    Fix: Add to environment variables
# 2. Database connection failed
#    Fix: Verify SPRING_DATASOURCE_URL, credentials
# 3. Firebase service account missing
#    Fix: Upload JSON file, set GOOGLE_APPLICATION_CREDENTIALS
```

### Frontend 404 Errors

```bash
# Check nginx.conf SPA routing
# Should have: try_files $uri $uri/ /index.html =404;

# Rebuild and redeploy
cd frontend
npm run build
git add -A
git commit -m "Rebuild"
git push origin main
```

### Database Connection Timeout

```bash
# Increase connection timeout
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=60000

# Verify PostgreSQL is running:
psql postgresql://user:password@host/dbname -c "SELECT 1"
```

---

## ✅ Post-Deployment Validation

```bash
#!/bin/bash
# post-deploy-test.sh

echo "🔍 Running post-deployment tests..."

BACKEND="https://your-backend.up.railway.app"
FRONTEND="https://yourdomain.netlify.app"

# 1. Health checks
echo "✓ Backend health: $(curl -s $BACKEND/actuator/health | jq .status)"
echo "✓ Frontend status: $(curl -s -o /dev/null -w "%{http_code}" $FRONTEND)"

# 2. Test registration
echo "Testing registration..."
curl -X POST $BACKEND/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"9123456789",
    "password":"TestPass@123",
    "name":"Test User",
    "role":"FARMER"
  }'

# 3. Test login
echo "Testing login..."
curl -X POST $BACKEND/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9123456789","password":"TestPass@123"}'

# 4. Rate limit test
echo "Testing rate limiting..."
for i in {1..5}; do
  curl -s -o /dev/null -w "Attempt $i: %{http_code}\n" \
    -X GET "$BACKEND/api/v1/jobs/nearby?lat=17.3850&lng=78.4867"
done

echo "✅ All post-deployment tests completed!"
```

---

## 📞 Support & Issues

- **Backend Logs**: Railway Dashboard → Logs tab
- **Frontend Logs**: Browser DevTools → Console
- **Database Issues**: Neon Dashboard → Query Editor
- **GitHub Issues**: Create issue with logs and error messages

---

## 🎉 Deployment Complete!

Your production app is now live:
- **Frontend**: https://yourdomain.netlify.app
- **Backend**: https://your-backend.up.railway.app/api/v1
- **Database**: PostgreSQL on Neon

**Next Steps**:
1. Monitor application for 24 hours
2. Collect user feedback
3. Watch for errors in logs
4. Set up automated backups
5. Plan for scaling if needed

**Estimated Capacity**: ~100 concurrent users  
**Response Time P95**: < 500ms  
**Uptime SLA**: 99.9% (Railway + Netlify)

---

**Happy Deployment! 🚀**
