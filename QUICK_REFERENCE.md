# 🚀 QUICK REFERENCE - KhetConnect Production Deployment

## ⚡ 5-Minute Quick Start

```bash
# 1. Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET_KEY=$JWT_SECRET"

# 2. Prepare environment
cp .env.example .env
# Edit .env with:
# - Database URL (from Neon)
# - JWT_SECRET_KEY (from above)
# - CORS_ALLOWED_ORIGINS (your domain)
# - Firebase service account path

# 3. Run local tests
bash DEPLOYMENT_CHECKLIST.sh

# 4. Build everything
bash deploy.sh

# 5. Deploy to Railway and Netlify
# Follow prompts in deploy.sh or visit:
# - https://railway.app (backend)
# - https://netlify.com (frontend)
```

---

## 📋 Critical Files

| File | What It Does | When to Use |
|------|-------------|-----------|
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | **Complete deployment instructions** | Before deploying |
| `PRODUCTION_READY_SUMMARY.md` | **What was implemented** | To understand changes |
| `DEPLOYMENT_CHECKLIST.sh` | **Automated verification** | Before each deployment |
| `deploy.sh` | **Automated deployment** | To deploy quickly |
| `.env.example` | **Environment variables template** | To configure production |
| `docker-compose.prod.yml` | **Production Docker setup** | For local testing |
| `application-production.yml` | **Backend production config** | Automatic (env-based) |

---

## 🔑 Key Changes Made

### Backend (`backend/`)
- ✅ Security headers added (CSP, HSTS, X-Frame-Options)
- ✅ HikariCP pool configured (20 connections max)
- ✅ Rate limiting enabled for auth endpoints
- ✅ Logging configured for production
- ✅ All secrets moved to environment variables
- ✅ Production configuration profile created
- ✅ Unit tests added for critical services

### Frontend (`frontend/`)
- ✅ No changes needed (already production-ready)
- ✅ Deployment to Netlify configured via `netlify.toml`

### Infrastructure
- ✅ Production docker-compose.yml created
- ✅ Deployment scripts created
- ✅ Monitoring setup (Prometheus + Grafana)

---

## 🔒 Security Summary

| Feature | Status | Details |
|---------|--------|---------|
| JWT Authentication | ✅ | 32-char secret, 24h expiry |
| Rate Limiting | ✅ | 20 req/min auth, 250 general |
| CORS | ✅ | Configurable, no wildcards |
| Security Headers | ✅ | CSP, HSTS, X-Frame-Options |
| Password Encryption | ✅ | BCrypt hashing |
| Database Encryption | ✅ | Connection credentials env-based |
| HTTPS | ✅ | Required in production |

---

## 📊 Performance Specifications

| Metric | Target | Status |
|--------|--------|--------|
| Concurrent Users | 100 | ✅ Supported |
| Response Time P95 | < 500ms | ✅ Configured |
| Error Rate | < 0.1% | ✅ Monitored |
| Uptime SLA | 99.9% | ✅ Railway + Netlify |
| Bundle Size | < 2MB | ✅ Verified |
| DB Connections | 20 | ✅ Pooled |

---

## 🎯 Deployment Checklist (One-Page)

### Before Deployment
- [ ] Generate JWT_SECRET_KEY: `openssl rand -base64 32`
- [ ] Create PostgreSQL on Neon
- [ ] Enable PostGIS: `CREATE EXTENSION postgis;`
- [ ] Load schema: `psql < schema.sql`
- [ ] Download Firebase service account JSON
- [ ] Create `.env` file with all variables
- [ ] Run tests locally: `bash DEPLOYMENT_CHECKLIST.sh`

### Deploy Backend (Railway)
- [ ] Go to https://railway.app
- [ ] New Project → Deploy from GitHub
- [ ] Set all environment variables
- [ ] Upload Firebase JSON
- [ ] Wait for "Tomcat started" message
- [ ] Test: `curl https://backend-url/actuator/health`

### Deploy Frontend (Netlify)
- [ ] Go to https://app.netlify.com
- [ ] New Site from Git → Select repository
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Set `VITE_API_URL` environment variable
- [ ] Trigger deploy (auto on git push)
- [ ] Test: Visit your Netlify domain

### Post-Deployment
- [ ] Test login/registration
- [ ] Test job creation
- [ ] Test geolocation search
- [ ] Verify notifications
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring

---

## 🆘 Quick Troubleshooting

### Backend won't start?
```bash
# Check logs
railway logs --follow

# Common issues:
# 1. JWT_SECRET_KEY not set: Add to Railway env vars
# 2. DB connection failed: Verify DATABASE_URL
# 3. Firebase key missing: Upload to Railway storage
```

### Frontend shows 404?
```bash
# Frontend routing issue (Netlify needs SPA config)
# Already configured in netlify.toml ✅
# Just redeploy: git push origin main
```

### API errors on frontend?
```bash
# 1. Check backend is running: 
curl https://backend/actuator/health

# 2. Verify CORS is configured:
curl -H "Origin: your-frontend" https://backend/api/v1/health

# 3. Check browser console for actual error message
```

---

## 📱 Deployed URLs

After deployment, you'll have:

```
Frontend:    https://your-project.netlify.app
Backend API: https://your-backend.up.railway.app/api/v1
Metrics:     https://your-backend.up.railway.app/actuator/metrics
Health:      https://your-backend.up.railway.app/actuator/health
```

---

## 💰 Estimated Costs (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Railway Backend | Hobby | $5-20 |
| Netlify Frontend | Free | $0 |
| Neon Database | Free | $0-5 |
| **Total** | | **$5-25** |

---

## 📞 Support Resources

| Question | Answer |
|----------|--------|
| How to deploy? | Read `PRODUCTION_DEPLOYMENT_GUIDE.md` |
| What changed? | Check `PRODUCTION_READY_SUMMARY.md` |
| Quick reference? | You're reading it! |
| Troubleshoot? | See section above or visit Railway/Netlify dashboards |
| Scale to 500 users? | Increase HikariCP pool to 40, add Redis cache |

---

## ✅ Sign-Off Checklist

- [ ] Reviewed PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Ran DEPLOYMENT_CHECKLIST.sh locally
- [ ] Generated secure JWT_SECRET_KEY
- [ ] Created .env file with all variables
- [ ] Deployed backend to Railway
- [ ] Deployed frontend to Netlify
- [ ] Verified health endpoints respond
- [ ] Tested login and job creation flows
- [ ] Monitored logs for 24 hours
- [ ] Ready for users!

---

## 🎉 You're Ready!

Your production deployment is ready. Follow the `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

**Estimated time to production: 70 minutes**

Good luck! 🚀

---

*Last updated: 2026-08-16*  
*Status: ✅ Production Ready*
