#!/usr/bin/env python3
"""
generate_qr.py — QR code generator for pizza menu URL.

Usage:
    python generate_qr.py --url <MENU_URL> [--logo <LOGO_PATH>] [--output qr.png]

Install dependencies first:
    pip install qrcode[pil] Pillow
"""

import argparse
import sys
import qrcode
import qrcode.constants
from PIL import Image


def parse_args():
    parser = argparse.ArgumentParser(description='Generate a QR code PNG with optional logo overlay.')
    parser.add_argument('--url',    required=True,    help='URL to encode in the QR code.')
    parser.add_argument('--logo',   default=None,     help='Path to a logo image to embed in the center.')
    parser.add_argument('--output', default='qr.png', help='Output PNG file path (default: qr.png).')
    return parser.parse_args()


def generate_qr(url, logo_path, output_path):
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color='black', back_color='white').convert('RGBA')

    if logo_path:
        try:
            logo = Image.open(logo_path).convert('RGBA')
        except FileNotFoundError:
            print(f'Error: logo file not found: {logo_path}', file=sys.stderr)
            sys.exit(1)
        except Exception as exc:
            print(f'Error opening logo: {exc}', file=sys.stderr)
            sys.exit(1)

        qr_w, qr_h = qr_image.size
        max_logo_area = qr_w * qr_h * 0.15
        logo_w, logo_h = logo.size
        if logo_w * logo_h > max_logo_area:
            scale = (max_logo_area / (logo_w * logo_h)) ** 0.5
            logo = logo.resize((int(logo_w * scale), int(logo_h * scale)), Image.LANCZOS)

        logo_w, logo_h = logo.size
        qr_image.paste(logo, ((qr_w - logo_w) // 2, (qr_h - logo_h) // 2), mask=logo)

    # Ensure minimum 1000x1000 px output using high-quality upscale if needed
    w, h = qr_image.size
    if w < 1000 or h < 1000:
        new_size = max(1000, w, h)
        qr_image = qr_image.resize((new_size, new_size), Image.LANCZOS)

    qr_image.save(output_path, format='PNG')
    print(f'QR code saved to: {output_path}')


if __name__ == '__main__':
    args = parse_args()
    generate_qr(args.url, args.logo, args.output)
