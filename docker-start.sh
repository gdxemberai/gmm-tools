#!/bin/bash

# Docker Services Startup Script for Sports Card Arbitrage Tool
# Starts all services: PostgreSQL, Redis, Backend, and Frontend

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        echo ""
        echo "Please start Docker:"
        echo "  - macOS/Windows: Start Docker Desktop application"
        echo "  - Linux: sudo systemctl start docker"
        echo ""
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        echo ""
        echo "Creating .env file from template..."
        cp .env.example .env
        print_success ".env file created"
        echo ""
        print_warning "Please edit .env and add your OPENAI_API_KEY"
        echo "Then run this script again."
        echo ""
        exit 1
    fi
    
    # Check if OPENAI_API_KEY is set
    if grep -q "your_api_key_here" .env; then
        print_warning "OPENAI_API_KEY not configured in .env file"
        echo ""
        echo "Please edit .env and add your OpenAI API key:"
        echo "  Get your key from: https://platform.openai.com/api-keys"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check if a container is healthy
wait_for_health() {
    local container_name=$1
    local max_attempts=60
    local attempt=1
    
    print_info "Waiting for $container_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        # Check if container exists and is running
        if ! docker ps --filter "name=$container_name" --format "{{.Names}}" | grep -q "$container_name"; then
            if [ $attempt -gt 5 ]; then
                print_error "$container_name is not running"
                return 1
            fi
        else
            # Check health status
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
            
            if [ "$health_status" = "healthy" ]; then
                print_success "$container_name is healthy"
                return 0
            elif [ "$health_status" = "none" ]; then
                # Container doesn't have health check, just verify it's running
                if docker ps --filter "name=$container_name" --filter "status=running" --format "{{.Names}}" | grep -q "$container_name"; then
                    print_success "$container_name is running"
                    return 0
                fi
            fi
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    print_error "$container_name failed to become healthy"
    return 1
}

# Main execution
print_header "Sports Card Arbitrage Tool - Docker Startup"

# Check Docker is running
check_docker

# Check .env file
check_env_file

# Start Docker Compose services
print_info "Starting all Docker services..."
print_info "This may take a few minutes on first run (building images)..."
echo ""

if docker-compose up -d --build; then
    print_success "Docker Compose started"
else
    print_error "Failed to start Docker Compose"
    exit 1
fi

echo ""

# Wait for services in order
print_info "Waiting for services to be ready..."
echo ""

# 1. PostgreSQL
if ! wait_for_health "gmm-postgres"; then
    print_error "PostgreSQL failed to start"
    echo "Check logs with: docker-compose logs postgres"
    exit 1
fi

# 2. Redis
if ! wait_for_health "gmm-redis"; then
    print_error "Redis failed to start"
    echo "Check logs with: docker-compose logs redis"
    exit 1
fi

# 3. Backend (depends on postgres and redis)
if ! wait_for_health "gmm-backend"; then
    print_error "Backend failed to start"
    echo "Check logs with: docker-compose logs backend"
    exit 1
fi

# 4. Frontend (depends on backend)
if ! wait_for_health "gmm-frontend"; then
    print_error "Frontend failed to start"
    echo "Check logs with: docker-compose logs frontend"
    exit 1
fi

echo ""
print_header "All services are running!"

# Display service status
echo -e "${GREEN}${BOLD}Services Status:${NC}"
echo "  ✓ PostgreSQL - Running on port 5432"
echo "  ✓ Redis      - Running on port 6379"
echo "  ✓ Backend    - Running on port 8000"
echo "  ✓ Frontend   - Running on port 3000"
echo ""

# Display access URLs
echo -e "${BLUE}${BOLD}Access URLs:${NC}"
echo "  🌐 Frontend:     http://localhost:3000"
echo "  🔧 Backend API:  http://localhost:8000"
echo "  📚 API Docs:     http://localhost:8000/docs"
echo "  📖 ReDoc:        http://localhost:8000/redoc"
echo ""

# Display useful commands
echo -e "${YELLOW}${BOLD}Useful Commands:${NC}"
echo "  View all logs:       docker-compose logs -f"
echo "  View backend logs:   docker-compose logs -f backend"
echo "  View frontend logs:  docker-compose logs -f frontend"
echo "  Stop all services:   docker-compose down"
echo "  Restart services:    docker-compose restart"
echo "  View status:         docker-compose ps"
echo ""

print_success "Setup complete! Visit http://localhost:3000 to start analyzing cards!"
echo ""
