#!/bin/bash

# Complete Application Startup Script for Sports Card Arbitrage Tool
# This script starts all services using Docker Compose

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
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
    echo -e "${BLUE}${BOLD}================================================${NC}"
    echo -e "${BLUE}${BOLD}$1${NC}"
    echo -e "${BLUE}${BOLD}================================================${NC}"
    echo ""
}

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    print_header "Shutting down services..."
    docker-compose down
    print_success "All services stopped"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup SIGINT SIGTERM

# Main execution
clear
print_header "🏀 Sports Card Arbitrage Tool - Complete Startup"

echo -e "${BLUE}This script will start all services using Docker Compose:${NC}"
echo "  • PostgreSQL (Database)"
echo "  • Redis (Cache)"
echo "  • Backend API (FastAPI)"
echo "  • Frontend UI (Next.js)"
echo ""

# Run the docker-start.sh script
if [ -f "./docker-start.sh" ]; then
    chmod +x docker-start.sh
    ./docker-start.sh
else
    print_error "docker-start.sh not found"
    exit 1
fi

# Display final instructions
print_header "Application is running!"

echo -e "${GREEN}${BOLD}✨ Your Sports Card Arbitrage Tool is ready!${NC}"
echo ""
echo -e "${BLUE}${BOLD}Quick Start:${NC}"
echo "  1. Open your browser to http://localhost:3000"
echo "  2. Enter a card listing title (e.g., '2018 Panini Prizm Luka Doncic Rookie PSA 10')"
echo "  3. Enter the listing price"
echo "  4. Click 'Analyze Listing' to see if it's a good deal!"
echo ""
echo -e "${YELLOW}${BOLD}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running and show logs
print_info "Showing application logs (Ctrl+C to stop)..."
echo ""

docker-compose logs -f
