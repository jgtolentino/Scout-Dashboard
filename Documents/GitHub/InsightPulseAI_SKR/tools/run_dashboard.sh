#!/bin/bash
# Quick script to run the Superset dashboard in Docker

# ANSI color codes
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m" # No Color

DASHBOARD_IMAGE="brand-analytics-dashboard:v1"
DASHBOARD_TAR="/Users/tbwa/Downloads/superset/brand-analytics-dashboard-v1.tar"

echo -e "${BLUE}${BOLD}📊 Running Superset Dashboard${NC}"
echo -e "${YELLOW}This script will start the Superset dashboard in Docker${NC}"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Docker first: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker first${NC}"
    exit 1
fi

# Check if image exists, if not load it
if ! docker image inspect "$DASHBOARD_IMAGE" &> /dev/null; then
    echo -e "${YELLOW}Dashboard image not found, loading from tar file...${NC}"
    if [ -f "$DASHBOARD_TAR" ]; then
        docker load -i "$DASHBOARD_TAR"
    else
        echo -e "${RED}Error: Dashboard tar file not found: $DASHBOARD_TAR${NC}"
        echo -e "${YELLOW}Please run the superset_docker_pack.sh script first${NC}"
        exit 1
    fi
fi

# Check if there's already a container running on port 8088
if lsof -Pi :8088 -sTCP:LISTEN -t &> /dev/null; then
    echo -e "${RED}Warning: Port 8088 is already in use${NC}"
    echo -e "${YELLOW}Do you want to stop the current process and continue? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        PID=$(lsof -Pi :8088 -sTCP:LISTEN -t)
        echo -e "${YELLOW}Stopping process $PID...${NC}"
        kill -9 "$PID" || true
    else
        echo -e "${YELLOW}Aborting...${NC}"
        exit 1
    fi
fi

# Run the dashboard
echo -e "${GREEN}Starting dashboard container...${NC}"
echo -e "${YELLOW}Container will continue running in the background.${NC}"

CONTAINER_ID=$(docker run -d -p 8088:8088 "$DASHBOARD_IMAGE")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ Dashboard started successfully!${NC}"
    echo -e "${BLUE}Container ID: $CONTAINER_ID${NC}"
    echo
    echo -e "${BOLD}Access your dashboard at:${NC} http://localhost:8088"
    echo -e "${BOLD}Username:${NC} admin"
    echo -e "${BOLD}Password:${NC} admin"
    echo
    echo -e "${YELLOW}To stop the dashboard, run:${NC}"
    echo -e "docker stop $CONTAINER_ID"
else
    echo -e "${RED}Failed to start dashboard container${NC}"
    exit 1
fi

# Open the browser automatically (if available)
if command -v open &> /dev/null; then
    echo -e "${YELLOW}Opening browser...${NC}"
    # Wait a bit for container to start up
    sleep 5
    open "http://localhost:8088"
elif command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}Opening browser...${NC}"
    sleep 5
    xdg-open "http://localhost:8088"
fi