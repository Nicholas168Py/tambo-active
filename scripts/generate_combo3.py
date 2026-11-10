import os
import itertools
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

# Paths
BASE_DIR = Path(r'c:\xampp\htdocs\tambo-active')
OUTPUT_DIR = BASE_DIR / 'public' / 'camisetas' / 'combo_3'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Source hero shirt image (used as mask/template)
HERO_IMG_PATH = BASE_DIR / 'public' / 'hero' / 'camisa-hero.png'
hero_img = Image.open(HERO_IMG_PATH).convert('RGBA')
# Ensure hero size matches desired shirt size (optional resize)
# Define canvas size
CANVAS_W, CANVAS_H = 2400, 1792

# Colors list (hex strings)
COLORS = ['#111111', '#dadada', '#172349', '#4b5320', '#858b93', '#3f4043']

# Function to tint an image with a given hex color
def tint_image(img, hex_color):
    # Create a solid color image
    color_img = Image.new('RGBA', img.size, hex_color)
    # Composite using multiply blend mode approximated via ImageChops.multiply
    return ImageChops.multiply(img, color_img)

# Simple drop shadow generator
def add_drop_shadow(img, offset=(10, 10), background_color=0xffffff, shadow_color=0x444444, border=20, iterations=3):
    total_width = img.width + abs(offset[0]) + 2 * border
    total_height = img.height + abs(offset[1]) + 2 * border
    back = Image.new(img.mode, (total_width, total_height), background_color)
    # Create shadow image
    shadow = Image.new('RGBA', img.size, shadow_color)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
    # Paste shadow
    shadow_left = border + max(offset[0], 0)
    shadow_top = border + max(offset[1], 0)
    back.paste(shadow, (shadow_left, shadow_top), shadow)
    # Paste original image on top
    img_left = border - min(offset[0], 0)
    img_top = border - min(offset[1], 0)
    back.paste(img, (img_left, img_top), img)
    return back

# Generate all combinations (allow repetitions, order matters for front/mid/back)
combos = list(itertools.product(COLORS, repeat=3))

for idx, (front_hex, mid_hex, back_hex) in enumerate(combos, start=1):
    # Create canvas white
    canvas = Image.new('RGBA', (CANVAS_W, CANVAS_H), (255, 255, 255, 255))

    # Prepare three shirt images tinted
    front = hero_img.copy()
    mid = hero_img.copy()
    back = hero_img.copy()
    # Apply tint (simple overlay using putalpha)
    front = ImageOps.colorize(front.convert('L'), black="black", white=front_hex)
    mid = ImageOps.colorize(mid.convert('L'), black="black", white=mid_hex)
    back = ImageOps.colorize(back.convert('L'), black="black", white=back_hex)

    # Add drop shadow to each
    front = add_drop_shadow(front, offset=(0, 8))
    mid = add_drop_shadow(mid, offset=(0, 8))
    back = add_drop_shadow(back, offset=(0, 8))

    # Define positions (centered, with slight offset for depth)
    center_x = CANVAS_W // 2
    center_y = CANVAS_H // 2
    # Back shirt (furthest)
    back_pos = (center_x - back.width // 2 + 30, center_y - back.height // 2 + 30)
    # Mid shirt
    mid_pos = (center_x - mid.width // 2, center_y - mid.height // 2)
    # Front shirt (closest)
    front_pos = (center_x - front.width // 2 - 30, center_y - front.height // 2 - 30)

    canvas.paste(back, back_pos, back)
    canvas.paste(mid, mid_pos, mid)
    canvas.paste(front, front_pos, front)

    filename = f'combo-3-{idx:02d}.png'
    out_path = OUTPUT_DIR / filename
    canvas.save(out_path, format='PNG')

print(f'Generated {len(combos)} images in {OUTPUT_DIR}')
