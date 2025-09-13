# Docker Support for Pulser CLI

This document explains how to run the Pulser CLI in Docker.

## Prerequisites

- Docker installed and running on your machine
- Docker Compose (optional, for running with DeepSeekr1 API)

## Quick Start

### Build the Docker Image

```bash
./docker-build.sh
```

### Run the CLI

```bash
./docker-run.sh
```

This will start the Pulser CLI in API mode by default, with your local `~/.pulser` directory mounted for persistence.

## Run with Different Modes

### API Mode (Default)

```bash
./docker-run.sh --api
```

### Local Mode

```bash
./docker-run.sh --local
```

### Demo Mode

```bash
./docker-run.sh --demo
```

### Debug Mode

Add the `--debug` flag to any command:

```bash
./docker-run.sh --api --debug
```

## Running with Docker Compose

If you want to run both the Pulser CLI and the DeepSeekr1 API in Docker:

```bash
./docker-compose-up.sh
```

This will:
1. Start the DeepSeekr1 API service
2. Run the Pulser CLI
3. Shut down all services when you exit

## Manual Docker Commands

If you prefer to use Docker directly:

```bash
# Build the image
docker build -t pulser-cli .

# Run in API mode
docker run -it --rm -v $HOME/.pulser:/root/.pulser pulser-cli --api

# Run in demo mode
docker run -it --rm -v $HOME/.pulser:/root/.pulser pulser-cli --demo
```

## Docker Compose

```bash
# Start all services
docker-compose up -d

# Run the CLI
docker-compose run --rm pulser

# Shut down all services
docker-compose down
```

## Configuration

The container uses the configuration in `~/.pulser` on your host machine. This includes:

- `~/.pulser_config.json` - CLI configuration
- `~/.pulser_context.json` - Session context and history

These files are created automatically if they don't exist.