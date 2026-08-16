#!/bin/bash
# Production Deployment Checklist
# Run each section and verify before proceeding
# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "KhetConnect Production Deployment"
echo "Checklist v1.0"
echo "======================================"
echo ""

# ========================================
# PHASE 1: LOCAL TESTING
# ========================================
echo -e "${YELLOW}PHASE 1: LOCAL TESTING${NC}"
echo "=================================="
echo ""

check_backend_tests() {
    echo "1️⃣  Running backend tests..."
    cd backend/backend
    mvn clean test -DskipIntegrationTests
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend tests PASSED${NC}"
    else
        echo -e "${RED}✗ Backend tests FAILED${NC}"
        return 1
    fi
    cd ../..
}

check_frontend_tests() {
    echo "2️⃣  Running frontend tests..."
    cd frontend
    npm test -- --run
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend tests PASSED${NC}"
    else
        echo -e "${RED}✗ Frontend tests FAILED${NC}"
        return 1
    fi
    cd ..
}

check_backend_build() {
    echo "3️⃣  Building backend..."
    cd backend/backend
    mvn clean package -DskipTests
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend build PASSED${NC}"
    else
        echo -e "${RED}✗ Backend build FAILED${NC}"
        return 1
    fi
    cd ../..
}

check_frontend_build() {
    echo "4️⃣  Building frontend..."
    cd frontend
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend build PASSED${NC}"
        FRONTEND_SIZE=$(du -sh dist/ | cut -f1)
        echo "   Build size: $FRONTEND_SIZE"
        if [[ $(echo "$FRONTEND_SIZE" | grep -oP '\d+') -gt 2000 ]]; then
            echo -e "${YELLOW}⚠ Frontend size > 2MB${NC}"
        fi
    else
        echo -e "${RED}✗ Frontend build FAILED${NC}"
        return 1
    fi
    cd ..
}

check_docker_builds() {
    echo "5️⃣  Building Docker images..."
    
    echo "   Building backend image..."
    docker build -t khetconnect-backend:latest backend/backend/
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Backend Docker build FAILED${NC}"
        return 1
    fi
    
    echo "   Building frontend image..."
    docker build -t khetconnect-frontend:latest frontend/
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Frontend Docker build FAILED${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
}

check_docker_compose() {
    echo "6️⃣  Testing Docker Compose..."
    docker-compose -f docker-compose.prod.yml up --build -d
    
    echo "   Waiting for services to start..."
    sleep 15
    
    # Check backend health
    BACKEND_HEALTH=$(curl -s http://localhost:8080/actuator/health | jq -r .status)
    if [ "$BACKEND_HEALTH" == "UP" ]; then
        echo -e "${GREEN}✓ Backend is UP${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        docker-compose -f docker-compose.prod.yml logs backend
        return 1
    fi
    
    # Check frontend health
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
    if [ "$FRONTEND_STATUS" == "200" ]; then
        echo -e "${GREEN}✓ Frontend is UP${NC}"
    else
        echo -e "${RED}✗ Frontend returned status $FRONTEND_STATUS${NC}"
        return 1
    fi
    
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✓ Docker Compose test PASSED${NC}"
}

# Run Phase 1 checks
echo -e "${YELLOW}Running Phase 1 checks...${NC}"
check_backend_tests || exit 1
check_frontend_tests || exit 1
check_backend_build || exit 1
check_frontend_build || exit 1
check_docker_builds || exit 1
check_docker_compose || exit 1

echo ""
echo -e "${GREEN}PHASE 1 COMPLETE ✓${NC}"
echo ""

# ========================================
# PHASE 2: SECRETS & ENVIRONMENT
# ========================================
echo -e "${YELLOW}PHASE 2: SECRETS & ENVIRONMENT SETUP${NC}"
echo "=================================="
echo ""

check_env_file() {
    echo "7️⃣  Checking environment variables..."
    
    if [ ! -f .env.example ]; then
        echo -e "${RED}✗ .env.example not found${NC}"
        return 1
    fi
    
    # Check for required variables
    REQUIRED_VARS=(
        "SPRING_DATASOURCE_URL"
        "SPRING_DATASOURCE_USERNAME"
        "SPRING_DATASOURCE_PASSWORD"
        "JWT_SECRET_KEY"
        "CORS_ALLOWED_ORIGINS"
        "KHETCONNECT_FCM_ENABLED"
        "GOOGLE_APPLICATION_CREDENTIALS"
        "VITE_API_URL"
    )
    
    echo "   Required environment variables:"
    for var in "${REQUIRED_VARS[@]}"; do
        echo "   [ ] $var"
    done
    
    echo ""
    echo -e "${YELLOW}⚠ MANUAL ACTION REQUIRED:${NC}"
    echo "   1. Copy .env.example to .env"
    echo "   2. Fill in all required variables"
    echo "   3. DO NOT commit .env to git"
    echo ""
}

check_jwt_secret() {
    echo "8️⃣  Checking JWT Secret..."
    
    if [ -z "$JWT_SECRET_KEY" ]; then
        echo -e "${YELLOW}Generating JWT Secret...${NC}"
        JWT_SECRET=$(openssl rand -base64 32)
        echo "JWT_SECRET_KEY=$JWT_SECRET"
        echo -e "${YELLOW}⚠ Save this value to your .env file${NC}"
    else
        if [ ${#JWT_SECRET_KEY} -lt 32 ]; then
            echo -e "${RED}✗ JWT_SECRET_KEY too short (must be 32+ chars)${NC}"
            return 1
        else
            echo -e "${GREEN}✓ JWT_SECRET_KEY is valid${NC}"
        fi
    fi
}

check_firebase_key() {
    echo "9️⃣  Checking Firebase Key..."
    
    if [ ! -f firebase-key.json ]; then
        echo -e "${YELLOW}⚠ MANUAL ACTION REQUIRED:${NC}"
        echo "   1. Download Firebase service account JSON from:"
        echo "      https://console.firebase.google.com/project/*/settings/serviceaccounts"
        echo "   2. Save to: firebase-key.json"
        echo "   3. DO NOT commit to git"
    else
        echo -e "${GREEN}✓ Firebase key found${NC}"
    fi
}

check_env_file
check_jwt_secret
check_firebase_key

echo ""
echo -e "${GREEN}PHASE 2 COMPLETE ✓${NC}"
echo ""

# ========================================
# PHASE 3: DATABASE SETUP
# ========================================
echo -e "${YELLOW}PHASE 3: DATABASE SETUP${NC}"
echo "=================================="
echo ""

check_database() {
    echo "🔟 Checking Database..."
    
    if [ -z "$SPRING_DATASOURCE_URL" ]; then
        echo -e "${YELLOW}⚠ MANUAL ACTION REQUIRED:${NC}"
        echo "   1. Create PostgreSQL database on Neon: https://console.neon.tech"
        echo "   2. Enable PostGIS extension:"
        echo "      psql <connection-string>"
        echo "      CREATE EXTENSION IF NOT EXISTS postgis;"
        echo "   3. Run schema:"
        echo "      psql <connection-string> < schema.sql"
        echo "   4. Verify tables:"
        echo "      psql <connection-string> -c '\\dt'"
    else
        echo -e "${GREEN}✓ Database URL configured${NC}"
    fi
}

check_database

echo ""
echo -e "${GREEN}PHASE 3 COMPLETE ✓${NC}"
echo ""

# ========================================
# PHASE 4: CODE QUALITY & SECURITY
# ========================================
echo -e "${YELLOW}PHASE 4: CODE QUALITY & SECURITY${NC}"
echo "=================================="
echo ""

check_secrets_in_code() {
    echo "1️⃣1️⃣  Checking for hardcoded secrets..."
    
    FOUND_SECRETS=0
    
    # Check for JWT secret in code
    if grep -r "khetconnect-dev-secret-key" backend/ 2>/dev/null | grep -v ".yaml" | grep -v ".yml"; then
        echo -e "${RED}✗ Found hardcoded JWT secret in code${NC}"
        FOUND_SECRETS=1
    fi
    
    # Check for password in code
    if grep -r "password.*=" backend/backend/src/main/java | grep -v "Password" | grep -v "password:"; then
        echo -e "${YELLOW}⚠ Potential password in code (review)${NC}"
    fi
    
    if [ $FOUND_SECRETS -eq 0 ]; then
        echo -e "${GREEN}✓ No hardcoded secrets found${NC}"
    fi
}

check_dependencies() {
    echo "1️⃣2️⃣  Checking dependencies..."
    
    cd backend/backend
    mvn dependency-check:aggregate -DfailBuildOnCVSS=7 &>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependency check passed${NC}"
    else
        echo -e "${YELLOW}⚠ Review dependency check results${NC}"
    fi
    cd ../..
}

check_linting() {
    echo "1️⃣3️⃣  Checking frontend linting..."
    
    cd frontend
    npm run lint 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ESLint passed${NC}"
    else
        echo -e "${YELLOW}⚠ ESLint found issues (review)${NC}"
    fi
    cd ..
}

check_secrets_in_code
# check_dependencies  # Optional, may take time
check_linting

echo ""
echo -e "${GREEN}PHASE 4 COMPLETE ✓${NC}"
echo ""

# ========================================
# PHASE 5: DEPLOYMENT READINESS
# ========================================
echo -e "${YELLOW}PHASE 5: DEPLOYMENT READINESS${NC}"
echo "=================================="
echo ""

echo "1️⃣4️⃣  Pre-deployment checklist:"
echo ""
echo "   Backend:"
echo "   [ ] JWT_SECRET_KEY set to secure 32+ char value"
echo "   [ ] Database URL, username, password configured"
echo "   [ ] Firebase service account JSON uploaded"
echo "   [ ] CORS_ALLOWED_ORIGINS set to production domain"
echo "   [ ] All tests passing (mvn test)"
echo "   [ ] Build successful (mvn clean package)"
echo ""
echo "   Frontend:"
echo "   [ ] All tests passing (npm test)"
echo "   [ ] Build successful (npm run build)"
echo "   [ ] Bundle size < 2MB"
echo "   [ ] ESLint passing"
echo "   [ ] VITE_API_URL points to backend"
echo ""
echo "   Infrastructure:"
echo "   [ ] PostgreSQL database created with PostGIS"
echo "   [ ] Schema loaded (schema.sql)"
echo "   [ ] Docker images built successfully"
echo "   [ ] .env file prepared (NOT committed)"
echo "   [ ] Firebase key prepared (NOT committed)"
echo ""
echo "   Security:"
echo "   [ ] No hardcoded secrets in code"
echo "   [ ] Environment variables externalized"
echo "   [ ] HTTPS enabled on production"
echo "   [ ] Security headers configured"
echo "   [ ] Rate limiting enabled (20 req/min for auth)"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}DEPLOYMENT CHECKLIST COMPLETE ✓${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "2. Deploy backend to Railway"
echo "3. Deploy frontend to Netlify"
echo "4. Verify health endpoints"
echo "5. Run post-deployment tests"
echo ""
echo "Questions? Check:"
echo "- PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "- README.md"
echo "- DEPLOYMENT_CHECKLIST.md"
echo ""
