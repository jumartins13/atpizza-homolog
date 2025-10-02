#!/usr/bin/env python3
"""
Script to create a 180x180px iPhone icon with black background and ATPizza logo
"""

from PIL import Image, ImageDraw
import os

def create_iphone_icon():
    # Define dimensions
    icon_size = (180, 180)
    
    # Load the existing logo
    logo_path = "/Users/juliana.martins/Documents/ATPizza/public/images/logo.png"
    
    try:
        # Open the existing logo
        logo = Image.open(logo_path)
        print(f"Original logo size: {logo.size}")
        
        # Create new image with black background
        icon = Image.new('RGB', icon_size, color='#000000')
        
        # Calculate scaling to fit logo nicely in the icon
        # Leave some padding around the edges (about 20% padding)
        target_width = int(icon_size[0] * 0.8)  # 80% of icon width
        target_height = int(icon_size[1] * 0.8)  # 80% of icon height
        
        # Calculate scale factor to maintain aspect ratio
        scale_w = target_width / logo.size[0]
        scale_h = target_height / logo.size[1]
        scale = min(scale_w, scale_h)  # Use smaller scale to ensure it fits
        
        # Calculate new logo dimensions
        new_width = int(logo.size[0] * scale)
        new_height = int(logo.size[1] * scale)
        
        # Resize logo maintaining aspect ratio
        logo_resized = logo.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Calculate position to center the logo
        x = (icon_size[0] - new_width) // 2
        y = (icon_size[1] - new_height) // 2
        
        # Paste the logo onto the black background
        # Use the logo as its own mask to preserve transparency
        if logo_resized.mode == 'RGBA':
            icon.paste(logo_resized, (x, y), logo_resized)
        else:
            icon.paste(logo_resized, (x, y))
        
        # Save the new icon
        output_path = "/Users/juliana.martins/Documents/ATPizza/apple-touch-icon.png"
        icon.save(output_path, 'PNG', optimize=True)
        
        print(f"iPhone icon created successfully!")
        print(f"Final logo size in icon: {new_width}x{new_height}")
        print(f"Position: ({x}, {y})")
        print(f"Scale factor: {scale:.3f}")
        print(f"Saved to: {output_path}")
        
        return output_path
        
    except Exception as e:
        print(f"Error creating iPhone icon: {str(e)}")
        return None

if __name__ == "__main__":
    create_iphone_icon()