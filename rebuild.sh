#!/bin/bash

# Docker Rebuild Script for GMM Sports Card Arbitrage Tool
# This script cleans Docker cache and rebuilds the application

set -e  # Exit on error

echo "================================================"
echo "GMM Docker Rebuild Script"
echo "================================================"
echo ""

# Step 1: Clean Docker build cache
echo "Step 1/5: Cleaning Docker build cache..."
docker builder prune -a -f
echo "✓ Build cache cleaned"
echo ""

# Step 2: Clean Docker system (unused images and containers)
echo "Step 2/5: Cleaning Docker system..."
docker system prune -a -f
echo "✓ System cleaned"
echo ""

# Step 3: Stop and remove old containers
echo "Step 3/5: Removing old containers and volumes..."
docker-compose down -v
echo "✓ Old containers removed"
echo ""

# Step 4: Build without cache
echo "Step 4/5: Building services without cache..."
docker-compose build --no-cache
echo "✓ Build completed"
echo ""

# Step 5: Start services
echo "Step 5/5: Starting services..."
docker-compose up -d
echo "✓ Services started"
echo ""

echo "================================================"
echo "Rebuild Complete!"
echo "================================================"
echo ""
echo "Check service status with:"
echo "  docker-compose ps"
echo ""
echo "View logs with:"
echo "  docker-compose logs -f"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "================================================"
