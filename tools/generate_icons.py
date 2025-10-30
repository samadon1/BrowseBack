#!/usr/bin/env python3
"""
BrowseBack Icon Generator
Creates Apple-style icons in 3 sizes (16x16, 48x48, 128x128)
Requires: pip install pillow
"""

from PIL import Image, ImageDraw
import os

def create_gradient_background(size):
    """Create a purple gradient background"""
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Gradient colors (purple)
    start_color = (102, 126, 234)  # #667eea
    end_color = (139, 92, 246)     # #8b5cf6

    # Create gradient
    for y in range(size):
        # Calculate color for this row
        ratio = y / size
        r = int(start_color[0] * (1 - ratio) + end_color[0] * ratio)
        g = int(start_color[1] * (1 - ratio) + end_color[1] * ratio)
        b = int(start_color[2] * (1 - ratio) + end_color[2] * ratio)

        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    return image

def create_rounded_rectangle(size, radius):
    """Create a rounded rectangle mask"""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=255)
    return mask

def draw_brain_icon(draw, size):
    """Draw simplified brain icon with search magnifier"""
    center_x = size // 2
    center_y = size // 2

    if size >= 128:
        # Full detailed icon for 128x128
        # Left hemisphere
        draw.ellipse([size*0.25, size*0.35, size*0.48, size*0.72], fill=(255, 255, 255, 240))
        # Right hemisphere
        draw.ellipse([size*0.52, size*0.35, size*0.75, size*0.72], fill=(255, 255, 255, 240))
        # Connection
        draw.rectangle([size*0.47, size*0.45, size*0.53, size*0.62], fill=(255, 255, 255, 230))

        # Memory nodes
        for y_offset in [0.4, 0.53, 0.66]:
            draw.ellipse([size*0.36-4, size*y_offset-4, size*0.36+4, size*y_offset+4], fill=(255, 255, 255, 200))
            draw.ellipse([size*0.64-4, size*y_offset-4, size*0.64+4, size*y_offset+4], fill=(255, 255, 255, 200))

        # Search magnifier
        draw.ellipse([size*0.72, size*0.72, size*0.82, size*0.82], outline=(255, 255, 255, 230), width=3)
        draw.line([size*0.81, size*0.81, size*0.88, size*0.88], fill=(255, 255, 255, 230), width=3)

    elif size >= 48:
        # Simplified for 48x48
        draw.ellipse([size*0.25, size*0.35, size*0.48, size*0.72], fill=(255, 255, 255, 240))
        draw.ellipse([size*0.52, size*0.35, size*0.75, size*0.72], fill=(255, 255, 255, 240))
        draw.rectangle([size*0.47, size*0.45, size*0.53, size*0.62], fill=(255, 255, 255, 230))

        # Fewer nodes
        for y_offset in [0.45, 0.62]:
            draw.ellipse([size*0.36-3, size*y_offset-3, size*0.36+3, size*y_offset+3], fill=(255, 255, 255, 200))
            draw.ellipse([size*0.64-3, size*y_offset-3, size*0.64+3, size*y_offset+3], fill=(255, 255, 255, 200))

        # Search magnifier
        draw.ellipse([size*0.72, size*0.72, size*0.82, size*0.82], outline=(255, 255, 255, 230), width=2)
        draw.line([size*0.81, size*0.81, size*0.88, size*0.88], fill=(255, 255, 255, 230), width=2)

    else:
        # Very simple for 16x16
        draw.ellipse([size*0.25, size*0.3, size*0.48, size*0.75], fill=(255, 255, 255, 240))
        draw.ellipse([size*0.52, size*0.3, size*0.75, size*0.75], fill=(255, 255, 255, 240))
        # Tiny search icon
        draw.ellipse([size*0.68, size*0.68, size*0.82, size*0.82], outline=(255, 255, 255, 230), width=2)

def create_icon(size):
    """Create icon of specified size"""
    # Create gradient background
    image = create_gradient_background(size)

    # Apply rounded corners
    radius = int(size * 0.22)  # 22% radius for Apple-style rounding
    mask = create_rounded_rectangle(size, radius)

    # Apply mask to background
    background = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    background.paste(image, (0, 0), mask)

    # Draw brain icon on top
    draw = ImageDraw.Draw(background, 'RGBA')
    draw_brain_icon(draw, size)

    return background

def main():
    """Generate all three icon sizes"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')

    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)

    sizes = [16, 48, 128]

    print("🎨 Generating BrowseBack icons...")

    for size in sizes:
        filename = f'icon{size}.png'
        filepath = os.path.join(icons_dir, filename)

        print(f"   Creating {filename} ({size}x{size})...")
        icon = create_icon(size)
        icon.save(filepath, 'PNG', optimize=True)
        print(f"   ✅ Saved to {filepath}")

    print("\n🎉 All icons generated successfully!")
    print(f"📁 Location: {icons_dir}/")
    print("\nFiles created:")
    print("   - icon16.png  (16×16)")
    print("   - icon48.png  (48×48)")
    print("   - icon128.png (128×128)")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Error: Pillow library not found")
        print("📦 Install it with: pip install pillow")
        print("\nOr use the HTML icon generator instead:")
        print("   Open icon-generator.html in your browser")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTry using the HTML icon generator instead:")
        print("   Open icon-generator.html in your browser")
