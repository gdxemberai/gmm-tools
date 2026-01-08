#!/usr/bin/env python3
"""
Setup Verification Script for Sports Card Arbitrage Tool
Checks all components and dependencies to ensure proper setup.
"""

import os
import sys
import subprocess
import socket
from pathlib import Path
from typing import Tuple, List

# Color codes for terminal output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    BOLD = '\033[1m'
    NC = '\033[0m'  # No Color

def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{Colors.BLUE}{Colors.BOLD}{text}{Colors.NC}")
    print("=" * len(text))
    print()

def print_success(text: str) -> None:
    """Print a success message."""
    print(f"{Colors.GREEN}✓{Colors.NC} {text}")

def print_error(text: str) -> None:
    """Print an error message."""
    print(f"{Colors.RED}✗{Colors.NC} {text}")

def print_warning(text: str) -> None:
    """Print a warning message."""
    print(f"{Colors.YELLOW}⚠{Colors.NC} {text}")

def print_info(text: str) -> None:
    """Print an info message."""
    print(f"{Colors.BLUE}ℹ{Colors.NC} {text}")

def check_command_exists(command: str) -> bool:
    """Check if a command exists in PATH."""
    try:
        subprocess.run(
            [command, "--version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False
        )
        return True
    except FileNotFoundError:
        return False

def check_docker_running() -> Tuple[bool, str]:
    """Check if Docker daemon is running."""
    try:
        result = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False
        )
        if result.returncode == 0:
            return True, "Docker is running"
        else:
            return False, "Docker daemon is not running"
    except FileNotFoundError:
        return False, "Docker is not installed"

def check_docker_container(container_name: str) -> Tuple[bool, str]:
    """Check if a Docker container is running."""
    try:
        result = subprocess.run(
            ["docker", "ps", "--filter", f"name={container_name}", "--format", "{{.Names}}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False
        )
        if container_name in result.stdout:
            return True, f"{container_name} container is running"
        else:
            return False, f"{container_name} container is not running"
    except Exception as e:
        return False, f"Error checking {container_name}: {str(e)}"

def check_port_open(host: str, port: int) -> bool:
    """Check if a port is open."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    try:
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

def check_database_connection() -> Tuple[bool, str]:
    """Check PostgreSQL database connection."""
    try:
        # Try to import required modules
        import asyncpg
        import asyncio
        
        async def test_connection():
            try:
                conn = await asyncpg.connect(
                    host='localhost',
                    port=5432,
                    user='admin',
                    password='admin123',
                    database='sports_cards',
                    timeout=5
                )
                
                # Check for pg_trgm extension
                result = await conn.fetchval(
                    "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')"
                )
                
                await conn.close()
                return True, result
            except Exception as e:
                return False, str(e)
        
        success, extension_exists = asyncio.run(test_connection())
        
        if success:
            if extension_exists:
                return True, "Database connection successful, pg_trgm extension installed"
            else:
                return True, "Database connected but pg_trgm extension not found"
        else:
            return False, f"Database connection failed: {extension_exists}"
            
    except ImportError:
        return False, "asyncpg module not installed (run backend setup first)"
    except Exception as e:
        return False, f"Error: {str(e)}"

def check_redis_connection() -> Tuple[bool, str]:
    """Check Redis connection."""
    try:
        import redis
        
        client = redis.Redis(host='localhost', port=6379, socket_timeout=5)
        client.ping()
        client.close()
        return True, "Redis connection successful"
    except ImportError:
        return False, "redis module not installed (run backend setup first)"
    except Exception as e:
        return False, f"Redis connection failed: {str(e)}"

def check_backend_api() -> Tuple[bool, str]:
    """Check if backend API is responding."""
    try:
        import urllib.request
        import json
        
        req = urllib.request.Request(
            'http://localhost:8000/health',
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if data.get('status') == 'healthy':
                return True, "Backend API is healthy"
            else:
                return False, f"Backend API returned: {data.get('status', 'unknown')}"
    except urllib.error.URLError:
        return False, "Backend API is not running (start with: uvicorn app.main:app --reload)"
    except Exception as e:
        return False, f"Error checking backend: {str(e)}"

def check_frontend_server() -> Tuple[bool, str]:
    """Check if frontend dev server is running."""
    if check_port_open('localhost', 3000):
        return True, "Frontend dev server is running"
    else:
        return False, "Frontend dev server is not running (start with: npm run dev)"

def check_file_exists(filepath: str) -> Tuple[bool, str]:
    """Check if a file exists."""
    if Path(filepath).exists():
        return True, f"{filepath} exists"
    else:
        return False, f"{filepath} not found"

def check_env_variable(filepath: str, var_name: str) -> Tuple[bool, str]:
    """Check if an environment variable is set in .env file."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith(var_name):
                    value = line.split('=', 1)[1].strip()
                    if value and value != 'your_api_key_here':
                        return True, f"{var_name} is set"
                    else:
                        return False, f"{var_name} is not configured"
        return False, f"{var_name} not found in {filepath}"
    except Exception as e:
        return False, f"Error reading {filepath}: {str(e)}"

def main():
    """Run all verification checks."""
    print_header("🔍 Sports Card Arbitrage Tool - Setup Verification")
    
    checks_passed = 0
    checks_failed = 0
    warnings = 0
    
    # Track issues for summary
    issues: List[str] = []
    optional_issues: List[str] = []
    
    # Check 1: Docker
    print_info("Checking Docker...")
    success, message = check_docker_running()
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        issues.append("Start Docker Desktop or Docker daemon")
        checks_failed += 1
    
    # Check 2: PostgreSQL Container
    print_info("Checking PostgreSQL container...")
    success, message = check_docker_container("gmm-postgres")
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        issues.append("Start Docker services: ./docker-start.sh")
        checks_failed += 1
    
    # Check 3: Redis Container
    print_info("Checking Redis container...")
    success, message = check_docker_container("gmm-redis")
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        if "Start Docker services" not in issues:
            issues.append("Start Docker services: ./docker-start.sh")
        checks_failed += 1
    
    # Check 4: Database Connection
    print_info("Checking database connection...")
    success, message = check_database_connection()
    if success:
        print_success(message)
        checks_passed += 1
        
        # Check for pg_trgm extension specifically
        if "pg_trgm extension not found" in message:
            print_warning("pg_trgm extension not installed")
            issues.append("Initialize database: cd backend && python init_db.py")
            warnings += 1
    else:
        print_error(message)
        if "asyncpg module not installed" in message:
            issues.append("Run backend setup: cd backend && ./setup.sh")
        else:
            issues.append("Check database connection and credentials")
        checks_failed += 1
    
    # Check 5: Redis Connection
    print_info("Checking Redis connection...")
    success, message = check_redis_connection()
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        if "redis module not installed" in message:
            if "Run backend setup" not in str(issues):
                issues.append("Run backend setup: cd backend && ./setup.sh")
        checks_failed += 1
    
    # Check 6: Backend .env file
    print_info("Checking backend .env file...")
    success, message = check_file_exists("backend/.env")
    if success:
        print_success(message)
        checks_passed += 1
        
        # Check 7: OpenAI API Key
        print_info("Checking OpenAI API key...")
        success, message = check_env_variable("backend/.env", "OPENAI_API_KEY")
        if success:
            print_success(message)
            checks_passed += 1
        else:
            print_warning(message)
            optional_issues.append("Add OpenAI API key to backend/.env file")
            warnings += 1
    else:
        print_error(message)
        issues.append("Run backend setup: cd backend && ./setup.sh")
        checks_failed += 1
    
    # Check 8: Backend virtual environment
    print_info("Checking backend virtual environment...")
    success, message = check_file_exists("backend/venv")
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        if "Run backend setup" not in str(issues):
            issues.append("Run backend setup: cd backend && ./setup.sh")
        checks_failed += 1
    
    # Check 9: Frontend node_modules
    print_info("Checking frontend dependencies...")
    success, message = check_file_exists("frontend/node_modules")
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_error(message)
        issues.append("Install frontend dependencies: cd frontend && npm install")
        checks_failed += 1
    
    # Check 10: Backend API (optional - may not be running)
    print_info("Checking backend API...")
    success, message = check_backend_api()
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_warning(message)
        optional_issues.append("Backend API not running (optional during setup)")
        warnings += 1
    
    # Check 11: Frontend Server (optional - may not be running)
    print_info("Checking frontend dev server...")
    success, message = check_frontend_server()
    if success:
        print_success(message)
        checks_passed += 1
    else:
        print_warning(message)
        optional_issues.append("Frontend server not running (optional during setup)")
        warnings += 1
    
    # Print summary
    print()
    print("=" * 50)
    
    if checks_failed == 0 and warnings == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ All checks passed! Your setup is complete.{Colors.NC}")
        print()
        print("You can now start the application:")
        print(f"  {Colors.BLUE}./start.sh{Colors.NC}")
        print()
        print("Or start services individually:")
        print(f"  Backend:  {Colors.BLUE}cd backend && source venv/bin/activate && uvicorn app.main:app --reload{Colors.NC}")
        print(f"  Frontend: {Colors.BLUE}cd frontend && npm run dev{Colors.NC}")
    elif checks_failed == 0:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  Setup is mostly complete with {warnings} warning(s).{Colors.NC}")
        print()
        if optional_issues:
            print("Optional items:")
            for issue in optional_issues:
                print(f"  • {issue}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}❌ Setup incomplete. {checks_failed} check(s) failed.{Colors.NC}")
        print()
        if issues:
            print("Required actions:")
            for issue in issues:
                print(f"  • {issue}")
        print()
        if optional_issues:
            print("Optional items:")
            for issue in optional_issues:
                print(f"  • {issue}")
    
    print()
    print("=" * 50)
    print()
    
    # Exit with appropriate code
    sys.exit(0 if checks_failed == 0 else 1)

if __name__ == "__main__":
    main()
