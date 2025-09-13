#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
check_requirements() {
    print_message "Checking requirements..." "$YELLOW"
    
    local missing=0
    
    if ! command_exists docker; then
        print_message "Docker is not installed" "$RED"
        missing=1
    fi
    
    if ! command_exists docker-compose; then
        print_message "Docker Compose is not installed" "$RED"
        missing=1
    fi
    
    if ! command_exists python3; then
        print_message "Python 3 is not installed" "$RED"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        print_message "Please install missing requirements" "$RED"
        exit 1
    fi
    
    print_message "All requirements satisfied" "$GREEN"
}

# Function to start the development environment
start_dev() {
    print_message "Starting development environment..." "$YELLOW"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_message "Creating .env file from template..." "$YELLOW"
        cp .env.template .env
    fi
    
    # Start services
    docker-compose up -d
    
    print_message "Development environment started" "$GREEN"
    print_message "API: http://localhost:8000" "$GREEN"
    print_message "PgAdmin: http://localhost:5050" "$GREEN"
}

# Function to stop the development environment
stop_dev() {
    print_message "Stopping development environment..." "$YELLOW"
    docker-compose down
    print_message "Development environment stopped" "$GREEN"
}

# Function to show logs
show_logs() {
    print_message "Showing logs..." "$YELLOW"
    docker-compose logs -f
}

# Function to run tests
run_tests() {
    print_message "Running tests..." "$YELLOW"
    docker-compose exec app pytest
}

# Function to format code
format_code() {
    print_message "Formatting code..." "$YELLOW"
    docker-compose exec app black .
    docker-compose exec app isort .
}

# Function to check code quality
check_code() {
    print_message "Checking code quality..." "$YELLOW"
    docker-compose exec app flake8 .
    docker-compose exec app mypy .
}

# Function to show help
show_help() {
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start the development environment"
    echo "  stop        Stop the development environment"
    echo "  logs        Show logs"
    echo "  test        Run tests"
    echo "  format      Format code"
    echo "  check       Check code quality"
    echo "  help        Show this help message"
}

# Main script
check_requirements

case "$1" in
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "logs")
        show_logs
        ;;
    "test")
        run_tests
        ;;
    "format")
        format_code
        ;;
    "check")
        check_code
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_message "Unknown command: $1" "$RED"
        show_help
        exit 1
        ;;
esac 