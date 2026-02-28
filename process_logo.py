
from PIL import Image, ImageDraw
import os
import sys

def process_logo(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        exit(1)
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    img_cropped = img.crop((left, top, right, bottom))
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    img_cropped.putalpha(mask)
    img_cropped.save(output_path, 'PNG')
    print(f"Logo processed successfully!")
    print(f"Saved to: {output_path}")
    print(f"Original size: {width}x{height}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_logo.py <input_path> <output_path>")
        sys.exit(1)
    process_logo(sys.argv[1], sys.argv[2])

