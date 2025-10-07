#!/usr/bin/env python3
# Blender MCP Bridge - Enables Claude to manipulate Blender scenes via MCP
# Part of the Pulser MCP Stack for Creativity Applications

import bpy
import json
import sys
import threading
import time
import os
import traceback
import base64
from io import BytesIO
import websocket
import argparse
from PIL import Image

# Configuration
DEFAULT_MCP_SERVER = "ws://localhost:9876/mcp/blender"
DEFAULT_AUTH_TOKEN = ""  # For development only
CONFIG_FILE = os.path.expanduser("~/.pulser_mcp_blender.json")

class BlenderMCPBridge:
    def __init__(self, server_url, auth_token=None):
        self.server_url = server_url
        self.auth_token = auth_token
        self.ws = None
        self.connected = False
        self.scene_history = []
        self.max_history = 10
        self.last_render = None
        self.scene_metadata = {}
        
    def connect(self):
        """Establish WebSocket connection to MCP server"""
        try:
            headers = {}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            self.ws = websocket.WebSocketApp(
                self.server_url,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
                on_open=self.on_open,
                header=headers
            )
            
            # Start WebSocket connection in a background thread
            self.ws_thread = threading.Thread(target=self.ws.run_forever)
            self.ws_thread.daemon = True
            self.ws_thread.start()
            
            return True
        except Exception as e:
            print(f"Connection error: {str(e)}")
            return False
            
    def on_open(self, ws):
        """Called when WebSocket connection is established"""
        self.connected = True
        print("Connected to MCP server")
        
        # Register with capabilities
        self.send_message({
            "type": "register",
            "environment": "blender",
            "version": bpy.app.version_string,
            "capabilities": self.get_capabilities()
        })
        
        # Send initial scene info
        self.update_scene_metadata()
        
    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            
            if "type" not in data:
                self.send_error("Missing message type")
                return
                
            msg_type = data["type"]
            
            # Handle different message types
            if msg_type == "command":
                self.handle_command(data)
            elif msg_type == "query":
                self.handle_query(data)
            elif msg_type == "ping":
                self.send_message({"type": "pong"})
            else:
                self.send_error(f"Unknown message type: {msg_type}")
                
        except json.JSONDecodeError:
            self.send_error("Invalid JSON message")
        except Exception as e:
            self.send_error(f"Error processing message: {str(e)}")
            print(traceback.format_exc())
    
    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"WebSocket error: {error}")
        
    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket connection close"""
        self.connected = False
        print(f"WebSocket closed: {close_msg} (code: {close_status_code})")
        
        # Attempt to reconnect after a delay
        threading.Timer(5.0, self.connect).start()
    
    def send_message(self, data):
        """Send message to MCP server"""
        if not self.connected or not self.ws:
            print("Cannot send message: not connected")
            return False
            
        try:
            self.ws.send(json.dumps(data))
            return True
        except Exception as e:
            print(f"Send error: {str(e)}")
            return False
            
    def send_error(self, message):
        """Send error message to MCP server"""
        self.send_message({
            "type": "error",
            "message": message
        })
    
    def handle_command(self, data):
        """Process command messages from MCP server"""
        if "command" not in data:
            self.send_error("Missing command parameter")
            return
            
        command = data["command"]
        params = data.get("params", {})
        command_id = data.get("id", None)
        
        # Execute the command in the main Blender thread
        def execute_command():
            try:
                # Update scene state before command for history
                if command != "undo" and command != "capture_render":
                    self.capture_scene_state()
                
                result = None
                
                # Process commands
                if command == "create_object":
                    result = self.cmd_create_object(params)
                elif command == "transform_object":
                    result = self.cmd_transform_object(params)
                elif command == "set_material":
                    result = self.cmd_set_material(params)
                elif command == "capture_render":
                    result = self.cmd_capture_render(params)
                elif command == "run_script":
                    result = self.cmd_run_script(params)
                elif command == "undo":
                    result = self.cmd_undo(params)
                else:
                    self.send_error(f"Unknown command: {command}")
                    return
                    
                # Send success response
                self.send_message({
                    "type": "command_result",
                    "id": command_id,
                    "status": "success",
                    "result": result
                })
                
                # Update scene metadata after command
                self.update_scene_metadata()
                
            except Exception as e:
                print(traceback.format_exc())
                self.send_message({
                    "type": "command_result",
                    "id": command_id,
                    "status": "error",
                    "error": str(e)
                })
        
        # Run in the main Blender thread
        bpy.app.timers.register(execute_command)
    
    def handle_query(self, data):
        """Process query messages from MCP server"""
        if "query" not in data:
            self.send_error("Missing query parameter")
            return
            
        query = data["query"]
        params = data.get("params", {})
        query_id = data.get("id", None)
        
        # Execute the query in the main Blender thread
        def execute_query():
            try:
                result = None
                
                # Process queries
                if query == "scene_info":
                    result = self.query_scene_info(params)
                elif query == "object_info":
                    result = self.query_object_info(params)
                elif query == "material_info":
                    result = self.query_material_info(params)
                elif query == "get_render":
                    result = self.query_get_render(params)
                else:
                    self.send_error(f"Unknown query: {query}")
                    return
                    
                # Send success response
                self.send_message({
                    "type": "query_result",
                    "id": query_id,
                    "status": "success",
                    "result": result
                })
                
            except Exception as e:
                print(traceback.format_exc())
                self.send_message({
                    "type": "query_result",
                    "id": query_id,
                    "status": "error",
                    "error": str(e)
                })
        
        # Run in the main Blender thread
        bpy.app.timers.register(execute_query)
    
    # Command implementations
    def cmd_create_object(self, params):
        """Create a new object in the scene"""
        obj_type = params.get("type", "cube")
        location = params.get("location", [0, 0, 0])
        scale = params.get("scale", [1, 1, 1])
        name = params.get("name", None)
        
        # Create the object based on type
        if obj_type == "cube":
            bpy.ops.mesh.primitive_cube_add(size=1, location=location)
        elif obj_type == "sphere":
            bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=location)
        elif obj_type == "cylinder":
            bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=2, location=location)
        elif obj_type == "plane":
            bpy.ops.mesh.primitive_plane_add(size=2, location=location)
        elif obj_type == "monkey":
            bpy.ops.mesh.primitive_monkey_add(size=1, location=location)
        else:
            raise ValueError(f"Unsupported object type: {obj_type}")
            
        # Get the newly created object
        obj = bpy.context.active_object
        
        # Set name if provided
        if name:
            obj.name = name
            
        # Set scale
        obj.scale = scale
        
        return {
            "name": obj.name,
            "type": obj_type,
            "location": [obj.location.x, obj.location.y, obj.location.z],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z]
        }
    
    def cmd_transform_object(self, params):
        """Transform an existing object"""
        obj_name = params.get("name")
        if not obj_name or obj_name not in bpy.data.objects:
            raise ValueError(f"Object not found: {obj_name}")
            
        obj = bpy.data.objects[obj_name]
        
        # Update location if provided
        if "location" in params:
            loc = params["location"]
            obj.location = (loc[0], loc[1], loc[2])
            
        # Update rotation if provided (in degrees)
        if "rotation" in params:
            rot = params["rotation"]
            obj.rotation_euler = (
                rot[0] * (3.14159/180), 
                rot[1] * (3.14159/180), 
                rot[2] * (3.14159/180)
            )
            
        # Update scale if provided
        if "scale" in params:
            scale = params["scale"]
            obj.scale = (scale[0], scale[1], scale[2])
            
        return {
            "name": obj.name,
            "location": [obj.location.x, obj.location.y, obj.location.z],
            "rotation": [obj.rotation_euler.x * (180/3.14159), 
                         obj.rotation_euler.y * (180/3.14159), 
                         obj.rotation_euler.z * (180/3.14159)],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z]
        }
    
    def cmd_set_material(self, params):
        """Set material properties for an object"""
        obj_name = params.get("name")
        if not obj_name or obj_name not in bpy.data.objects:
            raise ValueError(f"Object not found: {obj_name}")
            
        obj = bpy.data.objects[obj_name]
        
        # Material settings
        color = params.get("color", [0.8, 0.8, 0.8, 1.0])
        metallic = params.get("metallic", 0.0)
        roughness = params.get("roughness", 0.5)
        mat_name = params.get("material_name", f"{obj_name}_material")
        
        # Create a new material or use existing
        if mat_name in bpy.data.materials:
            mat = bpy.data.materials[mat_name]
        else:
            mat = bpy.data.materials.new(name=mat_name)
            
        mat.use_nodes = True
        
        # Set basic properties (assuming Principled BSDF)
        if mat.node_tree:
            principled = None
            for node in mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    principled = node
                    break
                    
            if principled:
                principled.inputs["Base Color"].default_value = color
                principled.inputs["Metallic"].default_value = metallic
                principled.inputs["Roughness"].default_value = roughness
        
        # Assign material to object
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
            
        return {
            "name": obj.name,
            "material": {
                "name": mat.name,
                "color": color,
                "metallic": metallic,
                "roughness": roughness
            }
        }
    
    def cmd_capture_render(self, params):
        """Render the current scene and return image data"""
        resolution_x = params.get("resolution_x", 1024)
        resolution_y = params.get("resolution_y", 768)
        file_format = params.get("format", "PNG")
        samples = params.get("samples", 32)
        
        # Set render parameters
        scene = bpy.context.scene
        scene.render.resolution_x = resolution_x
        scene.render.resolution_y = resolution_y
        scene.render.image_settings.file_format = file_format
        
        # For Cycles renderer
        if scene.render.engine == 'CYCLES':
            scene.cycles.samples = samples
            
        # Set temporary output path
        temp_render_path = "/tmp/mcp_blender_render.png"
        scene.render.filepath = temp_render_path
        
        # Render scene
        bpy.ops.render.render(write_still=True)
        
        # Read image and convert to base64
        try:
            with open(temp_render_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
                
            # Store last render data
            self.last_render = encoded_image
                
            return {
                "width": resolution_x,
                "height": resolution_y,
                "format": file_format,
                "data": encoded_image
            }
        except Exception as e:
            print(f"Error processing render: {str(e)}")
            return {
                "error": f"Failed to process render: {str(e)}"
            }
    
    def cmd_run_script(self, params):
        """Run a Python script in Blender's context"""
        script = params.get("script", "")
        if not script:
            raise ValueError("No script provided")
            
        # Execute the script
        try:
            # Create locals dict to capture return values
            locals_dict = {}
            exec(script, globals(), locals_dict)
            
            # Extract any result variable if defined
            result = locals_dict.get("result", None)
            
            return {
                "success": True,
                "result": result
            }
        except Exception as e:
            print(traceback.format_exc())
            return {
                "success": False,
                "error": str(e)
            }
    
    def cmd_undo(self, params):
        """Restore previous scene state"""
        steps = params.get("steps", 1)
        
        if not self.scene_history or len(self.scene_history) < steps:
            raise ValueError(f"Cannot undo {steps} steps (history: {len(self.scene_history)})")
            
        # Get the state to restore
        state_idx = -steps
        state_data = self.scene_history[state_idx]
        
        # Remove entries from history
        self.scene_history = self.scene_history[:state_idx]
        
        # Restore scene from script
        self.cmd_run_script({"script": state_data})
        
        return {
            "success": True,
            "steps": steps
        }
    
    # Query implementations
    def query_scene_info(self, params):
        """Get information about the current scene"""
        scene = bpy.context.scene
        
        # Collect scene objects
        objects = []
        for obj in scene.objects:
            if obj.type == 'MESH':
                objects.append({
                    "name": obj.name,
                    "type": obj.type,
                    "location": [obj.location.x, obj.location.y, obj.location.z],
                    "visible": obj.visible_get()
                })
                
        # Collect scene materials
        materials = []
        for mat in bpy.data.materials:
            materials.append({
                "name": mat.name,
                "users": mat.users
            })
                
        return {
            "name": scene.name,
            "render_engine": scene.render.engine,
            "frame_current": scene.frame_current,
            "object_count": len(objects),
            "objects": objects,
            "materials": materials
        }
    
    def query_object_info(self, params):
        """Get detailed information about a specific object"""
        obj_name = params.get("name")
        if not obj_name or obj_name not in bpy.data.objects:
            raise ValueError(f"Object not found: {obj_name}")
            
        obj = bpy.data.objects[obj_name]
        
        # Basic object properties
        info = {
            "name": obj.name,
            "type": obj.type,
            "location": [obj.location.x, obj.location.y, obj.location.z],
            "rotation": [obj.rotation_euler.x * (180/3.14159), 
                         obj.rotation_euler.y * (180/3.14159), 
                         obj.rotation_euler.z * (180/3.14159)],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            "dimensions": [obj.dimensions.x, obj.dimensions.y, obj.dimensions.z],
            "visible": obj.visible_get()
        }
        
        # Add mesh info for mesh objects
        if obj.type == 'MESH' and obj.data:
            info["mesh"] = {
                "vertices": len(obj.data.vertices),
                "edges": len(obj.data.edges),
                "polygons": len(obj.data.polygons)
            }
            
        # Add material info
        if obj.material_slots:
            info["materials"] = []
            for slot in obj.material_slots:
                if slot.material:
                    info["materials"].append({
                        "name": slot.material.name
                    })
                    
        return info
    
    def query_material_info(self, params):
        """Get detailed information about a specific material"""
        mat_name = params.get("name")
        if not mat_name or mat_name not in bpy.data.materials:
            raise ValueError(f"Material not found: {mat_name}")
            
        mat = bpy.data.materials[mat_name]
        
        # Extract basic material properties
        info = {
            "name": mat.name,
            "users": mat.users,
            "use_nodes": mat.use_nodes
        }
        
        # Extract principled BSDF properties if available
        if mat.use_nodes and mat.node_tree:
            for node in mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    info["principled"] = {
                        "base_color": list(node.inputs["Base Color"].default_value),
                        "metallic": node.inputs["Metallic"].default_value,
                        "roughness": node.inputs["Roughness"].default_value,
                        "specular": node.inputs["Specular"].default_value
                    }
                    break
                    
        return info
    
    def query_get_render(self, params):
        """Get the last rendered image"""
        if not self.last_render:
            # No render available, create one
            return self.cmd_capture_render(params)
            
        resolution_x = params.get("resolution_x", 1024)
        resolution_y = params.get("resolution_y", 768)
        
        # If requested resolution is different from last render, re-render
        if (bpy.context.scene.render.resolution_x != resolution_x or 
            bpy.context.scene.render.resolution_y != resolution_y):
            return self.cmd_capture_render(params)
            
        # Otherwise return the cached render
        return {
            "width": bpy.context.scene.render.resolution_x,
            "height": bpy.context.scene.render.resolution_y,
            "format": bpy.context.scene.render.image_settings.file_format,
            "data": self.last_render
        }
    
    # Utility functions
    def get_capabilities(self):
        """Return capabilities of this Blender instance"""
        return {
            "renderer": bpy.context.scene.render.engine,
            "version": bpy.app.version_string,
            "platform": sys.platform,
            "supported_objects": ["cube", "sphere", "cylinder", "plane", "monkey"],
            "features": ["create_object", "transform_object", "set_material", 
                        "capture_render", "run_script", "undo"]
        }
        
    def capture_scene_state(self):
        """Capture current scene state for undo functionality"""
        # Generate Python script that can recreate current scene state
        script = self.generate_scene_state_script()
        
        # Add to history, keeping max_history limit
        self.scene_history.append(script)
        if len(self.scene_history) > self.max_history:
            self.scene_history = self.scene_history[-self.max_history:]
    
    def generate_scene_state_script(self):
        """Generate Python script to recreate current scene state"""
        script = "import bpy\n\n"
        
        # Clear existing objects
        script += "# Clear existing objects\n"
        script += "for obj in bpy.data.objects:\n"
        script += "    bpy.data.objects.remove(obj, do_unlink=True)\n\n"
        
        # Recreate objects
        script += "# Recreate objects\n"
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                mesh_type = "unknown"
                # Try to determine original primitive type (imperfect)
                if obj.name.startswith("Cube"):
                    mesh_type = "cube"
                elif obj.name.startswith("Sphere"):
                    mesh_type = "sphere"
                elif obj.name.startswith("Cylinder"):
                    mesh_type = "cylinder"
                elif obj.name.startswith("Plane"):
                    mesh_type = "plane"
                elif obj.name.startswith("Suzanne") or obj.name.startswith("Monkey"):
                    mesh_type = "monkey"
                    
                # Add creation code based on type
                if mesh_type == "cube":
                    script += f"bpy.ops.mesh.primitive_cube_add(size=1, location=({obj.location.x}, {obj.location.y}, {obj.location.z}))\n"
                elif mesh_type == "sphere":
                    script += f"bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=({obj.location.x}, {obj.location.y}, {obj.location.z}))\n"
                elif mesh_type == "cylinder":
                    script += f"bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=2, location=({obj.location.x}, {obj.location.y}, {obj.location.z}))\n"
                elif mesh_type == "plane":
                    script += f"bpy.ops.mesh.primitive_plane_add(size=2, location=({obj.location.x}, {obj.location.y}, {obj.location.z}))\n"
                elif mesh_type == "monkey":
                    script += f"bpy.ops.mesh.primitive_monkey_add(size=1, location=({obj.location.x}, {obj.location.y}, {obj.location.z}))\n"
                else:
                    # Skip objects we can't easily recreate
                    continue
                    
                # Set object name
                script += f"obj = bpy.context.active_object\n"
                script += f"obj.name = '{obj.name}'\n"
                
                # Set scale
                script += f"obj.scale = ({obj.scale.x}, {obj.scale.y}, {obj.scale.z})\n"
                
                # Set rotation
                script += f"obj.rotation_euler = ({obj.rotation_euler.x}, {obj.rotation_euler.y}, {obj.rotation_euler.z})\n"
                
                # Handle materials (simple version)
                if obj.material_slots:
                    for slot_idx, slot in enumerate(obj.material_slots):
                        if slot.material:
                            mat = slot.material
                            
                            # Create material
                            script += f"\n# Create material for {obj.name}\n"
                            script += f"mat = bpy.data.materials.new(name='{mat.name}')\n"
                            script += f"mat.use_nodes = True\n"
                            
                            # Set basic properties if possible
                            if mat.use_nodes and mat.node_tree:
                                for node in mat.node_tree.nodes:
                                    if node.type == 'BSDF_PRINCIPLED':
                                        color = node.inputs["Base Color"].default_value
                                        metallic = node.inputs["Metallic"].default_value
                                        roughness = node.inputs["Roughness"].default_value
                                        
                                        script += f"if mat.node_tree:\n"
                                        script += f"    principled = None\n"
                                        script += f"    for node in mat.node_tree.nodes:\n"
                                        script += f"        if node.type == 'BSDF_PRINCIPLED':\n"
                                        script += f"            principled = node\n"
                                        script += f"            break\n"
                                        script += f"    if principled:\n"
                                        script += f"        principled.inputs['Base Color'].default_value = ({color[0]}, {color[1]}, {color[2]}, {color[3]})\n"
                                        script += f"        principled.inputs['Metallic'].default_value = {metallic}\n"
                                        script += f"        principled.inputs['Roughness'].default_value = {roughness}\n"
                                        break
                            
                            # Assign material to object
                            script += f"if len(obj.data.materials) > {slot_idx}:\n"
                            script += f"    obj.data.materials[{slot_idx}] = mat\n"
                            script += f"else:\n"
                            script += f"    obj.data.materials.append(mat)\n"
                
                script += "\n"
        
        return script
    
    def update_scene_metadata(self):
        """Update metadata about the current scene"""
        scene = bpy.context.scene
        
        self.scene_metadata = {
            "name": scene.name,
            "objects": len(scene.objects),
            "last_update": time.time(),
            "render_engine": scene.render.engine,
            "frame_current": scene.frame_current
        }
        
        # Send update to server
        self.send_message({
            "type": "scene_update",
            "metadata": self.scene_metadata
        })

    def run(self):
        """Main entry point to run the bridge"""
        if not self.connect():
            print("Failed to connect to MCP server")
            return False
            
        print("Blender MCP Bridge running")
        return True
        
    def shutdown(self):
        """Shut down the bridge"""
        if self.ws:
            self.ws.close()
            
        print("Blender MCP Bridge shut down")

def load_config():
    """Load configuration from file"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_config(config):
    """Save configuration to file"""
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f)

def register():
    """Register the Blender addon"""
    # Will be called when loaded as Blender addon
    print("Blender MCP Bridge addon registered")
    
    # Load configuration
    config = load_config()
    server_url = config.get("server_url", DEFAULT_MCP_SERVER)
    auth_token = config.get("auth_token", DEFAULT_AUTH_TOKEN)
    
    # Create and run bridge
    bridge = BlenderMCPBridge(server_url, auth_token)
    bridge.run()
    
    # Store bridge instance
    if "mcp_bridge" not in globals():
        globals()["mcp_bridge"] = bridge

def unregister():
    """Unregister the Blender addon"""
    # Will be called when unloaded as Blender addon
    print("Blender MCP Bridge addon unregistered")
    
    # Shutdown bridge if running
    if "mcp_bridge" in globals():
        globals()["mcp_bridge"].shutdown()
        del globals()["mcp_bridge"]

# Main entry point when run as script
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Blender MCP Bridge")
    parser.add_argument("--server", default=DEFAULT_MCP_SERVER, help="MCP server URL")
    parser.add_argument("--token", default=DEFAULT_AUTH_TOKEN, help="Auth token")
    parser.add_argument("--save-config", action="store_true", help="Save configuration")
    
    args = parser.parse_args()
    
    # Save configuration if requested
    if args.save_config:
        config = {
            "server_url": args.server,
            "auth_token": args.token
        }
        save_config(config)
        print(f"Configuration saved to {CONFIG_FILE}")
    
    # When run inside Blender
    if "bpy" in globals():
        # Create and run bridge
        bridge = BlenderMCPBridge(args.server, args.token)
        bridge.run()
    else:
        print("This script must be run from within Blender")
        print("Use: blender --python blender_mcp_bridge.py -- [arguments]")
        sys.exit(1)