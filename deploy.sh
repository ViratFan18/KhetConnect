#!/bin/bash
# Quick production deployment script
# This script automates the deployment to Railway (backend) and Netlify (frontend)

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 KhetConnect Production Deployment${NC}"
echo "========================================"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}✗ git not found${NC}"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites found${NC}"
    echo ""
}

# Build backend
build_backend() {
    echo -e "${YELLOW}Building backend...${NC}"
    cd backend/backend
    mvn clean package -DskipTests
    cd ../..
    echo -e "${GREEN}✓ Backend built${NC}"
}

# Build frontend
build_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    cd frontend
    npm install
    npm run build
    cd ..
    echo -e "${GREEN}✓ Frontend built${NC}"
}

# Build Docker images
build_docker_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    docker build -t khetconnect-backend:latest backend/backend/ -f backend/backend/Dockerfile
    docker build -t khetconnect-frontend:latest frontend/ -f frontend/Dockerfile
    
    echo -e "${GREEN}✓ Docker images built${NC}"
}

# Push to git
push_to_git() {
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    
    git add -A
    git commit -m "Production deployment: $(date +'%Y-%m-%d %H:%M:%S')" || true
    git push origin main
    
    echo -e "${GREEN}✓ Pushed to GitHub${NC}"
}

# Deploy to Railway
deploy_to_railway() {
    echo -e "${YELLOW}Setting up Railway deployment...${NC}"
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Installing Railway CLI...${NC}"
        npm install -g @railway/cli
    fi
    
    echo -e "${YELLOW}Please configure Railway environment variables:${NC}"
    echo "1. Run: railway login"
    echo "2. Run: railway init"
    echo "3. Configure variables in Railway dashboard"
    echo "4. Run: railway up"
    echo ""
    echo "For more details, see PRODUCTION_DEPLOYMENT_GUIDE.md"
}

# Deploy to Netlify
deploy_to_netlify() {
    echo -e "${YELLOW}Setting up Netlify deployment...${NC}"
    
    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}Installing Netlify CLI...${NC}"
        npm install -g netlify-cli
    fi
    
    echo -e "${YELLOW}Please configure Netlify:${NC}"
    echo "1. Go to https://app.netlify.com"
    echo "2. Connect to your GitHub repository"
    echo "3. Set build command: npm run build"
    echo "4. Set publish directory: dist"
    echo "5. Configure environment variables"
    echo ""
    echo "Netlify will auto-deploy on git push to main"
}

# Post deployment verification
verify_deployment() {
    echo -e "${YELLOW}Post-deployment verification...${NC}"
    
    echo "Checking backend..."
    BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/actuator/health)
    
    if [ "$BACKEND_STATUS" == "200" ]; then
        echo -e "${GREEN}✓ Backend is UP${NC}"
    else
        echo -e "${RED}✗ Backend returned status $BACKEND_STATUS${NC}"
    fi
    
    echo "Checking frontend..."
    FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
    
    if [ "$FRONTEND_STATUS" == "200" ]; then
        echo -e "${GREEN}✓ Frontend is UP${NC}"
    else
        echo -e "${RED}✗ Frontend returned status $FRONTEND_STATUS${NC}"
    fi
}

# Main execution
main() {
    check_prerequisites
    
    # Ask user what to deploy
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo "1. Build everything (backend + frontend + Docker)"
    echo "2. Push to git (will trigger Netlify deployment)"
    echo "3. Full deployment (build + push)"
    echo "4. Setup Railway deployment"
    echo "5. Setup Netlify deployment"
    echo "6. Verify deployment"
    echo ""
    read -p "Select option (1-6): " option
    
    case $option in
        1)
            build_backend
            build_frontend
            build_docker_images
            ;;
        2)
            push_to_git
            ;;
        3)
            build_backend
            build_frontend
            build_docker_images
            push_to_git
            echo ""
            echo -e "${GREEN}✓ Build complete!${NC}"
            echo "Netlify will auto-deploy. Monitor at: https://app.netlify.com"
            ;;
        4)
            deploy_to_railway
            ;;
        5)
            deploy_to_netlify
            ;;
        6)
            verify_deployment
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Deployment script completed!${NC}"
    echo ""
    echo "For detailed instructions, see: PRODUCTION_DEPLOYMENT_GUIDE.md"
}

main "$@"
