#!/usr/bin/env python3
# Pulser Robot 3D Model Generator for Blender

import bpy
import math
import random
import os

class PulserRobotGenerator:
    """Generate a 3D robot mascot for Pulser in Blender"""
    
    def __init__(self):
        self.robot_parts = {}
        self.materials = {}
        self.colors = {
            'primary': (0.0, 0.4, 0.8, 1.0),    # Blue
            'secondary': (0.1, 0.9, 0.8, 1.0),  # Teal
            'accent': (0.9, 0.2, 0.3, 1.0),     # Red
            'metal': (0.8, 0.8, 0.9, 1.0),      # Silver
            'dark': (0.2, 0.2, 0.3, 1.0),       # Dark blue/gray
            'light': (0.9, 0.9, 1.0, 1.0)       # Light blue/white
        }
    
    def reset_scene(self):
        """Clear the current scene"""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()
        
        # Clear materials
        for material in bpy.data.materials:
            bpy.data.materials.remove(material)
        
        # Clear meshes
        for mesh in bpy.data.meshes:
            bpy.data.meshes.remove(mesh)
    
    def create_material(self, name, color, metallic=0.0, roughness=0.5, emission_strength=0.0):
        """Create a material with the given properties"""
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        
        # Clear default nodes
        for node in nodes:
            nodes.remove(node)
        
        # Create principal shader
        shader = nodes.new(type='ShaderNodeBsdfPrincipled')
        shader.location = (0, 0)
        shader.inputs['Base Color'].default_value = color
        shader.inputs['Metallic'].default_value = metallic
        shader.inputs['Roughness'].default_value = roughness
        
        # Add emission if needed
        if emission_strength > 0:
            shader.inputs['Emission Strength'].default_value = emission_strength
            shader.inputs['Emission'].default_value = color
        
        # Create output node
        output = nodes.new(type='ShaderNodeOutputMaterial')
        output.location = (300, 0)
        
        # Link nodes
        links = mat.node_tree.links
        links.new(shader.outputs['BSDF'], output.inputs['Surface'])
        
        self.materials[name] = mat
        return mat
    
    def setup_materials(self):
        """Create all materials needed for the robot"""
        self.create_material('primary', self.colors['primary'], metallic=0.3, roughness=0.3)
        self.create_material('secondary', self.colors['secondary'], metallic=0.1, roughness=0.2)
        self.create_material('accent', self.colors['accent'], metallic=0.0, roughness=0.2, emission_strength=1.0)
        self.create_material('metal', self.colors['metal'], metallic=0.9, roughness=0.1)
        self.create_material('dark', self.colors['dark'], metallic=0.4, roughness=0.3)
        self.create_material('light', self.colors['light'], metallic=0.0, roughness=0.1, emission_strength=0.2)
    
    def create_head(self):
        """Create the robot head"""
        # Main head cube
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.5))
        head = bpy.context.active_object
        head.name = "robot_head"
        head.scale = (0.8, 0.7, 0.5)
        head.data.materials.append(self.materials['primary'])
        self.robot_parts['head'] = head
        
        # Create eyes
        for i, x in enumerate([-0.25, 0.25]):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.05, location=(x, 0.36, 1.55))
            eye = bpy.context.active_object
            eye.name = f"robot_eye_{i}"
            eye.rotation_euler = (math.pi/2, 0, 0)
            eye.data.materials.append(self.materials['accent'])
            self.robot_parts[f'eye_{i}'] = eye
        
        # Create antenna
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.3, location=(0, 0, 1.95))
        antenna = bpy.context.active_object
        antenna.name = "robot_antenna"
        antenna.data.materials.append(self.materials['metal'])
        self.robot_parts['antenna'] = antenna
        
        # Add small sphere on top of antenna
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0, 0, 2.1))
        antenna_top = bpy.context.active_object
        antenna_top.name = "robot_antenna_top"
        antenna_top.data.materials.append(self.materials['accent'])
        self.robot_parts['antenna_top'] = antenna_top
        
        return head
    
    def create_body(self):
        """Create the robot body"""
        # Main body
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))
        body = bpy.context.active_object
        body.name = "robot_body"
        body.scale = (0.7, 0.5, 0.75)
        body.data.materials.append(self.materials['primary'])
        self.robot_parts['body'] = body
        
        # Create chest panel
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.3, 0.8))
        chest = bpy.context.active_object
        chest.name = "robot_chest"
        chest.scale = (0.5, 0.05, 0.5)
        chest.data.materials.append(self.materials['secondary'])
        self.robot_parts['chest'] = chest
        
        # Create control buttons
        for i, pos in enumerate([(-0.15, 0.36, 0.9), (0, 0.36, 0.9), (0.15, 0.36, 0.9)]):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.02, location=pos)
            button = bpy.context.active_object
            button.name = f"robot_button_{i}"
            button.rotation_euler = (math.pi/2, 0, 0)
            button.data.materials.append(self.materials['accent'])
            self.robot_parts[f'button_{i}'] = button
        
        return body
    
    def create_arms(self):
        """Create the robot arms"""
        arms = []
        
        # Create both arms
        for i, x in enumerate([-1, 1]):
            # Upper arm
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.5, location=(x * 0.8, 0, 0.9))
            upper_arm = bpy.context.active_object
            upper_arm.name = f"robot_upper_arm_{i}"
            upper_arm.rotation_euler = (0, math.pi/2, 0)
            upper_arm.data.materials.append(self.materials['metal'])
            self.robot_parts[f'upper_arm_{i}'] = upper_arm
            
            # Lower arm
            bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.45, location=(x * 1.2, 0, 0.6))
            lower_arm = bpy.context.active_object
            lower_arm.name = f"robot_lower_arm_{i}"
            lower_arm.rotation_euler = (0, math.pi/2, 0)
            lower_arm.data.materials.append(self.materials['metal'])
            self.robot_parts[f'lower_arm_{i}'] = lower_arm
            
            # Hand
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(x * 1.5, 0, 0.6))
            hand = bpy.context.active_object
            hand.name = f"robot_hand_{i}"
            hand.scale = (0.7, 0.7, 0.7)
            hand.data.materials.append(self.materials['secondary'])
            self.robot_parts[f'hand_{i}'] = hand
            
            arms.append((upper_arm, lower_arm, hand))
        
        return arms
    
    def create_legs(self):
        """Create the robot legs"""
        legs = []
        
        # Create both legs
        for i, x in enumerate([-1, 1]):
            # Upper leg
            bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.5, location=(x * 0.3, 0, 0.1))
            upper_leg = bpy.context.active_object
            upper_leg.name = f"robot_upper_leg_{i}"
            upper_leg.data.materials.append(self.materials['primary'])
            self.robot_parts[f'upper_leg_{i}'] = upper_leg
            
            # Lower leg
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.5, location=(x * 0.3, 0, -0.4))
            lower_leg = bpy.context.active_object
            lower_leg.name = f"robot_lower_leg_{i}"
            lower_leg.data.materials.append(self.materials['metal'])
            self.robot_parts[f'lower_leg_{i}'] = lower_leg
            
            # Foot
            bpy.ops.mesh.primitive_cube_add(size=0.3, location=(x * 0.3, 0.1, -0.7))
            foot = bpy.context.active_object
            foot.name = f"robot_foot_{i}"
            foot.scale = (1.0, 1.5, 0.15)
            foot.data.materials.append(self.materials['secondary'])
            self.robot_parts[f'foot_{i}'] = foot
            
            legs.append((upper_leg, lower_leg, foot))
        
        return legs
    
    def create_pulser_logo(self):
        """Create the Pulser logo on the chest"""
        # Create a plane for the logo
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0.36, 0.8))
        logo = bpy.context.active_object
        logo.name = "pulser_logo"
        logo.scale = (0.25, 0.25, 0.25)
        
        # Create material with emission
        logo_mat = self.create_material('logo', (1.0, 1.0, 1.0, 1.0), metallic=0.0, roughness=0.0, emission_strength=2.0)
        logo.data.materials.append(logo_mat)
        
        # Add a simple "P" shape using a text object
        bpy.ops.object.text_add(location=(0, 0.37, 0.8))
        text = bpy.context.active_object
        text.data.body = "P"
        text.name = "pulser_text"
        text.scale = (0.15, 0.15, 0.15)
        text.data.materials.append(self.materials['accent'])
        self.robot_parts['logo_text'] = text
        
        return logo
    
    def add_lighting(self):
        """Add lighting to the scene"""
        # Create a main light
        bpy.ops.object.light_add(type='AREA', radius=1, location=(2, 2, 3))
        main_light = bpy.context.active_object
        main_light.name = "main_light"
        main_light.data.energy = 300
        
        # Create a fill light
        bpy.ops.object.light_add(type='AREA', radius=1, location=(-2, -1, 2))
        fill_light = bpy.context.active_object
        fill_light.name = "fill_light"
        fill_light.data.energy = 150
        
        # Create a rim light
        bpy.ops.object.light_add(type='SPOT', location=(0, -3, 1))
        rim_light = bpy.context.active_object
        rim_light.name = "rim_light"
        rim_light.data.energy = 200
        rim_light.rotation_euler = (math.pi/4, 0, 0)
        
        return [main_light, fill_light, rim_light]
    
    def setup_camera(self):
        """Set up the camera for rendering"""
        # Create camera if it doesn't exist
        if 'Camera' not in bpy.data.objects:
            bpy.ops.object.camera_add()
        
        camera = bpy.data.objects['Camera']
        camera.location = (3.5, -3.5, 2.5)
        camera.rotation_euler = (math.radians(65), 0, math.radians(55))
        
        # Set the camera as active
        bpy.context.scene.camera = camera
        
        return camera
    
    def create_environment(self):
        """Create a simple environment with a floor"""
        # Create floor
        bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.75))
        floor = bpy.context.active_object
        floor.name = "floor"
        
        # Create material for floor
        floor_mat = self.create_material('floor', (0.8, 0.8, 0.8, 1.0), metallic=0.0, roughness=0.7)
        floor.data.materials.append(floor_mat)
        
        # Add a world background color
        world = bpy.context.scene.world
        if not world:
            world = bpy.data.worlds.new("World")
            bpy.context.scene.world = world
        
        world.use_nodes = True
        bg_node = world.node_tree.nodes["Background"]
        bg_node.inputs[0].default_value = (0.05, 0.05, 0.1, 1.0)  # Dark blue background
        bg_node.inputs[1].default_value = 1.0  # Strength
        
        return floor
    
    def animate_robot(self, frames=250):
        """Add some simple animation to the robot"""
        # Set scene frames
        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = frames
        
        # Animate head rotation
        head = self.robot_parts['head']
        head.animation_data_create()
        head.animation_data.action = bpy.data.actions.new(name="HeadAction")
        
        # Create a rotation track
        rot_curve = head.animation_data.action.fcurves.new(data_path="rotation_euler", index=2)  # Z rotation
        
        # Create keyframes for head rotation
        keyframe_points = rot_curve.keyframe_points
        keyframe_points.add(4)
        keyframe_points[0].co = (1, 0)
        keyframe_points[1].co = (int(frames * 0.25), math.radians(15))
        keyframe_points[2].co = (int(frames * 0.75), math.radians(-15))
        keyframe_points[3].co = (frames, 0)
        
        # Make the interpolation smoother
        for kf in keyframe_points:
            kf.interpolation = 'BEZIER'
        
        # Animate antenna with different timing
        antenna_top = self.robot_parts['antenna_top']
        antenna_top.animation_data_create()
        antenna_top.animation_data.action = bpy.data.actions.new(name="AntennaAction")
        
        # Create a scale track for antenna top
        scale_curve = antenna_top.animation_data.action.fcurves.new(data_path="scale", index=0)  # X scale
        
        # Clone it for Y and Z
        scale_curve_y = antenna_top.animation_data.action.fcurves.new(data_path="scale", index=1)  # Y scale
        scale_curve_z = antenna_top.animation_data.action.fcurves.new(data_path="scale", index=2)  # Z scale
        
        # Create keyframes for antenna pulsing
        for i in range(5):
            frame = 1 + i * (frames // 4)
            scale_curve.keyframe_points.insert(frame, 1.0)
            scale_curve_y.keyframe_points.insert(frame, 1.0)
            scale_curve_z.keyframe_points.insert(frame, 1.0)
            
            pulse_frame = frame + (frames // 8)
            scale_curve.keyframe_points.insert(pulse_frame, 1.3)
            scale_curve_y.keyframe_points.insert(pulse_frame, 1.3)
            scale_curve_z.keyframe_points.insert(pulse_frame, 1.3)
        
        # Make all interpolations smoother
        for curve in [scale_curve, scale_curve_y, scale_curve_z]:
            for kf in curve.keyframe_points:
                kf.interpolation = 'BEZIER'
        
        # Animate eye color pulsing
        for i in range(2):
            eye = self.robot_parts[f'eye_{i}']
            eye_mat = eye.active_material
            nodes = eye_mat.node_tree.nodes
            emission_node = nodes["Principled BSDF"]
            
            # Animate emission strength
            eye.animation_data_create()
            eye.animation_data.action = bpy.data.actions.new(name=f"EyeAction_{i}")
            
            # Create a material animation track
            emission_curve = eye.animation_data.action.fcurves.new(data_path='active_material.node_tree.nodes["Principled BSDF"].inputs[19].default_value')
            
            # Create keyframes for eye emission
            for j in range(10):
                frame = 1 + j * (frames // 9)
                emission_curve.keyframe_points.insert(frame, 1.0)
                
                pulse_frame = frame + (frames // 18)
                emission_curve.keyframe_points.insert(pulse_frame, 3.0)
        
        # Do a complete turn animation
        empty = bpy.data.objects.new("AnimationControl", None)
        bpy.context.collection.objects.link(empty)
        empty.empty_display_size = 1
        empty.empty_display_type = 'PLAIN_AXES'
        
        # Parent all robot parts to the empty
        for part_name, part in self.robot_parts.items():
            part.parent = empty
        
        # Animate the empty's rotation
        empty.animation_data_create()
        empty.animation_data.action = bpy.data.actions.new(name="TurnAction")
        
        # Create a rotation track
        rot_curve = empty.animation_data.action.fcurves.new(data_path="rotation_euler", index=2)  # Z rotation
        
        # Create keyframes for full rotation
        keyframe_points = rot_curve.keyframe_points
        keyframe_points.add(2)
        keyframe_points[0].co = (1, 0)
        keyframe_points[1].co = (frames, math.radians(360))
        
        # Make the interpolation linear for constant rotation
        for kf in keyframe_points:
            kf.interpolation = 'LINEAR'
    
    def render_robot(self, output_path="pulser_robot.png", resolution=(1920, 1080)):
        """Render the robot to an image file"""
        # Set render settings
        render = bpy.context.scene.render
        render.resolution_x = resolution[0]
        render.resolution_y = resolution[1]
        render.resolution_percentage = 100
        render.image_settings.file_format = 'PNG'
        render.filepath = output_path
        
        # Set up cycles renderer
        bpy.context.scene.render.engine = 'CYCLES'
        bpy.context.scene.cycles.device = 'GPU'
        bpy.context.scene.cycles.samples = 200
        
        # Render the image
        bpy.ops.render.render(write_still=True)
        
        print(f"Rendered robot to {output_path}")
    
    def create_robot(self):
        """Create the complete robot"""
        self.reset_scene()
        self.setup_materials()
        
        # Create robot parts
        head = self.create_head()
        body = self.create_body()
        arms = self.create_arms()
        legs = self.create_legs()
        logo = self.create_pulser_logo()
        
        # Set up scene
        floor = self.create_environment()
        lights = self.add_lighting()
        camera = self.setup_camera()
        
        # Add animation
        self.animate_robot()
        
        return self.robot_parts
    
    def save_blend_file(self, filepath="pulser_robot.blend"):
        """Save the current scene to a blend file"""
        bpy.ops.wm.save_as_mainfile(filepath=filepath)
        print(f"Saved .blend file to {filepath}")

# Function to run when executed directly
def main():
    generator = PulserRobotGenerator()
    robot_parts = generator.create_robot()
    
    # Get current directory
    current_dir = os.path.dirname(os.path.realpath(__file__))
    
    # Save blend file
    blend_path = os.path.join(current_dir, "pulser_robot.blend")
    generator.save_blend_file(blend_path)
    
    # Render image
    render_path = os.path.join(current_dir, "pulser_robot.png")
    generator.render_robot(render_path)
    
    return {"status": "success", "message": "Pulser Robot created successfully!"}

# Function to be called by MCP
def create_pulser_robot(params=None):
    """Create the Pulser robot - can be called by MCP bridge"""
    return main()

# Run when executed directly
if __name__ == "__main__":
    main()