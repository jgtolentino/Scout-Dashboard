#!/usr/bin/env python3
# Extension for the Blender MCP Bridge to add Pulser robot functionality
# This should be imported into the main blender_mcp_bridge.py file

import bpy
import os
import sys
import importlib.util
import base64
from io import BytesIO

# Add parent directory to system path to import pulser_robot_3d
def import_pulser_robot_module():
    """Import the Pulser robot module dynamically"""
    script_dir = os.path.dirname(os.path.realpath(__file__))
    module_path = os.path.join(script_dir, "pulser_robot_3d.py")
    
    spec = importlib.util.spec_from_file_location("pulser_robot_3d", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    return module

def create_pulser_robot(params=None):
    """Create the Pulser robot in Blender and optionally render it"""
    try:
        # Import the robot module
        robot_module = import_pulser_robot_module()
        
        # Create the generator and robot
        generator = robot_module.PulserRobotGenerator()
        robot_parts = generator.create_robot()
        
        # Set up response
        response = {
            "status": "success",
            "message": "Pulser robot created successfully!",
            "parts": list(robot_parts.keys())
        }
        
        # Handle render if requested
        if params and params.get("render", False):
            output_path = params.get("output", "pulser_robot.png")
            generator.render_robot(output_path)
            response["render_path"] = output_path
            
            # Add image data to response if needed
            if os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    image_data = f.read()
                    response["image_data"] = base64.b64encode(image_data).decode('utf-8')
        
        # Save blend file if requested
        if params and params.get("save_blend", False):
            blend_path = params.get("blend_path", "pulser_robot.blend")
            generator.save_blend_file(blend_path)
            response["blend_path"] = blend_path
        
        return response
    
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        return {
            "status": "error",
            "message": f"Error creating Pulser robot: {str(e)}",
            "error_details": error_msg
        }

# Register these commands to be added to the BlenderMCPBridge class
BRIDGE_COMMANDS = {
    "create_pulser_robot": create_pulser_robot
}