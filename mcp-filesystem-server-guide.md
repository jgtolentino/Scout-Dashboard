# MCP Filesystem Server Setup Guide

## Overview
The mcp-filesystem-server by mark3labs enables AI models like Claude to interact directly with your local filesystem in a controlled way. This saves on API costs by reducing the need to copy/paste file contents into conversations.

## Features
- Read/write files
- Create/list/delete directories
- Move files/directories
- Search files
- Retrieve file metadata

## Installation

### 1. Install Go (if not already installed)
```bash
brew install go
```

### 2. Install MCP Filesystem Server
```bash
go install github.com/mark3labs/mcp-filesystem-server@latest
```

### 3. Verify Installation
The server binary should be installed at `~/go/bin/mcp-filesystem-server`

## Usage

### Start the Server
You can use the startup script at `/Users/tbwa/start-mcp-server.sh`:

```bash
~/start-mcp-server.sh
```

Or run it manually:

```bash
~/go/bin/mcp-filesystem-server /path/to/allowed/directory [additional/directories...]
```

### Connect Claude to the Server

#### CLI:
```bash
claude --tools mcp-filesystem-server
```

#### Web Interface:
Enable the MCP plugin in the Claude web interface

## Security Considerations
- Only directories specified when starting the server are accessible
- Consider security implications before allowing access to sensitive directories
- The server runs locally on your machine and doesn't expose your files to the internet

## Troubleshooting

### Server Not Starting
Check for existing instances:
```bash
ps -ef | grep mcp-filesystem-server
```

Kill existing instances:
```bash
pkill -f mcp-filesystem-server
```

### Permissions Issues
Ensure the allowed directories are readable/writable by your user.

## Benefits
- Reduced API costs - no need to copy/paste file contents
- More efficient workflows with direct file operations
- Greater context for AI assistants when working with your files