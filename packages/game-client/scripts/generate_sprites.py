#!/usr/bin/env python3
"""
Character Sprite Sheet Generator
Generates sprite frames from a single character image
"""

from PIL import Image
import os
import sys

def generate_character_sprites(
    input_image_path: str,
    output_dir: str,
    character_name: str,
    frame_size: tuple = (64, 64),
    states: dict = None
):
    """
    Generate character sprite frames from a single image
    
    Args:
        input_image_path: Path to input image
        output_dir: Directory to save generated frames
        character_name: Name of character for file naming
        frame_size: Size of each frame (width, height)
        states: Dict of state names and their row indices
    """
    
    if states is None:
        states = {
            'idle': 0,
            'down': 1,
            'up': 2,
            'left': 3,
            'right': 4
        }
    
    # Load image
    if not os.path.exists(input_image_path):
        print(f"Error: File not found: {input_image_path}")
        return False
    
    img = Image.open(input_image_path)
    print(f"Loaded image: {img.size}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    frame_width, frame_height = frame_size
    
    # Generate frames for each state
    for state_name, row_idx in states.items():
        y_offset = row_idx * frame_height
        
        # Calculate number of frames in this row
        num_frames = img.width // frame_width
        
        print(f"Generating {state_name}: {num_frames} frames")
        
        for frame_idx in range(num_frames):
            x_offset = frame_idx * frame_width
            
            # Crop frame
            box = (x_offset, y_offset, x_offset + frame_width, y_offset + frame_height)
            frame = img.crop(box)
            
            # Save frame
            output_path = os.path.join(output_dir, f"{character_name}_{state_name}_{frame_idx}.png")
            frame.save(output_path)
            print(f"  Saved: {output_path}")
    
    print("Done!")
    return True


if __name__ == "__main__":
    # Example usage
    input_path = sys.argv[1] if len(sys.argv) > 1 else "input.png"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "output"
    char_name = sys.argv[3] if len(sys.argv) > 3 else "character"
    
    generate_character_sprites(input_path, output_path, char_name)
