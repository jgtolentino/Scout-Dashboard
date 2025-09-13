#!/usr/bin/env python3
# Command to create the Pulser robot via MCP

import os
import json
import websocket
import argparse
import time
import base64
from io import BytesIO

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='Create Pulser Robot via MCP')
    parser.add_argument('--host', default='localhost', help='MCP server host')
    parser.add_argument('--port', default='9090', help='MCP server port')
    parser.add_argument('--render', action='store_true', help='Render the robot image')
    parser.add_argument('--output', default='pulser_robot.png', help='Output image path')
    args = parser.parse_args()
    
    # Connect to MCP server
    server_url = f"ws://{args.host}:{args.port}/mcp/blender"
    
    print(f"Connecting to MCP server at {server_url}...")
    ws = websocket.create_connection(server_url)
    
    # Send robot creation command
    command = {
        "type": "command",
        "id": "create_pulser_robot",
        "command": "create_pulser_robot",
        "params": {
            "render": args.render,
            "output": args.output
        }
    }
    
    print("Sending command to create Pulser robot...")
    ws.send(json.dumps(command))
    
    # Wait for response
    print("Waiting for response...")
    response = ws.recv()
    result = json.loads(response)
    
    if result.get("status") == "success":
        print("Pulser robot created successfully!")
        
        if args.render:
            print(f"Robot rendered to {args.output}")
            
            # If image data is included in the response, save it
            if "image_data" in result:
                image_data = base64.b64decode(result["image_data"])
                with open(args.output, "wb") as f:
                    f.write(image_data)
                print(f"Saved rendered image to {args.output}")
    else:
        print(f"Error creating robot: {result.get('error', 'Unknown error')}")
    
    ws.close()

if __name__ == "__main__":
    main()