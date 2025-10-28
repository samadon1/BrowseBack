#!/usr/bin/env python3
"""
Resize browseback.png to create all required icon sizes
Requires: pip install pillow
"""

from PIL import Image
import os

def resize_icon(input_path, output_dir, sizes):
    """Resize icon to multiple sizes with high quality"""

    # Open the original image
    print(f"📖 Opening {input_path}...")
    original = Image.open(input_path)

    # Ensure it has alpha channel
    if original.mode != 'RGBA':
        original = original.convert('RGBA')

    print(f"   Original size: {original.size}")
    print(f"   Format: {original.format}, Mode: {original.mode}")

    # Create output directory if needed
    os.makedirs(output_dir, exist_ok=True)

    # Resize to each required size
    for size in sizes:
        output_path = os.path.join(output_dir, f'icon{size}.png')

        print(f"\n🔄 Creating {size}x{size} icon...")

        # Use LANCZOS (highest quality) resampling
        resized = original.resize((size, size), Image.Resampling.LANCZOS)

        # Save with optimization
        resized.save(output_path, 'PNG', optimize=True)

        print(f"   ✅ Saved to {output_path}")
        print(f"   File size: {os.path.getsize(output_path) / 1024:.1f} KB")

    print(f"\n🎉 All icons created successfully!")
    print(f"📁 Location: {output_dir}/")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_image = os.path.join(script_dir, 'browseback.png')
    output_dir = os.path.join(script_dir, 'icons')

    # Required sizes for Chrome extension
    sizes = [16, 48, 128]

    if not os.path.exists(input_image):
        print(f"❌ Error: {input_image} not found")
        print("   Make sure browseback.png is in the same folder as this script")
        return

    print("🎨 BrowseBack Icon Resizer\n")
    resize_icon(input_image, output_dir, sizes)

    print("\n📝 Next steps:")
    print("   1. Check the icons/ folder")
    print("   2. Verify all three sizes look good")
    print("   3. Load the extension in Chrome to test")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Error: Pillow library not found")
        print("📦 Install it with: pip install pillow")
        print("\nOr resize manually:")
        print("   1. Open browseback.png in Preview/Photoshop")
        print("   2. Save as 128x128 → icon128.png")
        print("   3. Save as 48x48 → icon48.png")
        print("   4. Save as 16x16 → icon16.png")
    except Exception as e:
        print(f"❌ Error: {e}")
