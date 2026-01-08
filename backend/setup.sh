#!/bin/bash

# Backend Setup Script for Sports Card Arbitrage Tool
# This script automates the backend setup process

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

# Main setup process
print_header "Sports Card Arbitrage Tool - Backend Setup"

# Check if Python is installed
print_info "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
print_success "Python $PYTHON_VERSION found"

# Check Python version (require 3.11+)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
    print_warning "Python 3.11+ is recommended. You have $PYTHON_VERSION"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create virtual environment
print_info "Creating Python virtual environment..."
if [ -d "venv" ]; then
    print_warning "Virtual environment already exists"
    read -p "Recreate it? This will delete the existing venv. (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf venv
        python3 -m venv venv
        print_success "Virtual environment recreated"
    else
        print_info "Using existing virtual environment"
    fi
else
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate
print_success "Virtual environment activated"

# Upgrade pip
print_info "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
print_success "pip upgraded"

# Install dependencies
print_info "Installing Python dependencies..."
print_info "This may take a few minutes..."
if pip install -r requirements.txt > /dev/null 2>&1; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    print_info "Trying with verbose output..."
    pip install -r requirements.txt
    exit 1
fi

# Setup .env file
print_info "Setting up environment variables..."
if [ -f ".env" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env file"
    else
        cp .env.example .env
        print_success ".env file updated from template"
    fi
else
    cp .env.example .env
    print_success ".env file created from template"
fi

# Check for OpenAI API key
print_info "Checking OpenAI API key configuration..."
if grep -q "your_api_key_here" .env; then
    print_warning "OpenAI API key not configured"
    echo ""
    echo "You need an OpenAI API key to use the analysis features."
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Do you have an OpenAI API key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your OpenAI API key: " OPENAI_KEY
        if [ -n "$OPENAI_KEY" ]; then
            # Use different sed syntax for macOS vs Linux
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/OPENAI_API_KEY=your_api_key_here/OPENAI_API_KEY=$OPENAI_KEY/" .env
            else
                sed -i "s/OPENAI_API_KEY=your_api_key_here/OPENAI_API_KEY=$OPENAI_KEY/" .env
            fi
            print_success "OpenAI API key configured"
        else
            print_warning "No API key entered. You'll need to add it manually to .env"
        fi
    else
        print_warning "You can add your API key later by editing the .env file"
    fi
else
    print_success "OpenAI API key is already configured"
fi

# Display next steps
print_header "Setup Complete!"

echo -e "${GREEN}Backend setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Ensure Docker services are running:"
echo -e "   ${BLUE}cd ..${NC}"
echo -e "   ${BLUE}./docker-start.sh${NC}"
echo ""
echo "2. Initialize the database:"
echo -e "   ${BLUE}cd backend${NC}"
echo -e "   ${BLUE}source venv/bin/activate${NC}"
echo -e "   ${BLUE}python init_db.py${NC}"
echo -e "   ${BLUE}python seed_db.py${NC}"
echo ""
echo "3. Start the backend server:"
echo -e "   ${BLUE}uvicorn app.main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo ""
echo "Or use the complete startup script from the project root:"
echo -e "   ${BLUE}cd ..${NC}"
echo -e "   ${BLUE}./start.sh${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
