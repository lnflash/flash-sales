#!/bin/bash

# Generate all favicon sizes from the base 96x96 image
# Requires ImageMagick to be installed: brew install imagemagick

echo "Generating favicons from favicon-96x96.png..."

# Base image
BASE_IMAGE="public/icons/favicon-96x96.png"
ICONS_DIR="public/icons"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "brew install imagemagick"
    exit 1
fi

# Check if base image exists
if [ ! -f "$BASE_IMAGE" ]; then
    echo "Base image not found: $BASE_IMAGE"
    exit 1
fi

# Generate various icon sizes
echo "Generating icon-72x72.png..."
convert "$BASE_IMAGE" -resize 72x72 "$ICONS_DIR/icon-72x72.png"

echo "Generating icon-96x96.png..."
cp "$BASE_IMAGE" "$ICONS_DIR/icon-96x96.png"

echo "Generating icon-128x128.png..."
convert "$BASE_IMAGE" -resize 128x128 -background none -gravity center -extent 128x128 "$ICONS_DIR/icon-128x128.png"

echo "Generating icon-144x144.png..."
convert "$BASE_IMAGE" -resize 144x144 -background none -gravity center -extent 144x144 "$ICONS_DIR/icon-144x144.png"

echo "Generating icon-152x152.png..."
convert "$BASE_IMAGE" -resize 152x152 -background none -gravity center -extent 152x152 "$ICONS_DIR/icon-152x152.png"

echo "Generating icon-167x167.png..."
convert "$BASE_IMAGE" -resize 167x167 -background none -gravity center -extent 167x167 "$ICONS_DIR/icon-167x167.png"

echo "Generating icon-180x180.png..."
convert "$BASE_IMAGE" -resize 180x180 -background none -gravity center -extent 180x180 "$ICONS_DIR/icon-180x180.png"

echo "Generating icon-192x192.png..."
convert "$BASE_IMAGE" -resize 192x192 -background none -gravity center -extent 192x192 "$ICONS_DIR/icon-192x192.png"

echo "Generating icon-384x384.png..."
convert "$BASE_IMAGE" -resize 384x384 -background none -gravity center -extent 384x384 "$ICONS_DIR/icon-384x384.png"

echo "Generating icon-512x512.png..."
convert "$BASE_IMAGE" -resize 512x512 -background none -gravity center -extent 512x512 "$ICONS_DIR/icon-512x512.png"

# Also update the web-app-manifest icons
echo "Generating web-app-manifest-192x192.png..."
convert "$BASE_IMAGE" -resize 192x192 -background none -gravity center -extent 192x192 "$ICONS_DIR/web-app-manifest-192x192.png"

echo "Generating web-app-manifest-512x512.png..."
convert "$BASE_IMAGE" -resize 512x512 -background none -gravity center -extent 512x512 "$ICONS_DIR/web-app-manifest-512x512.png"

# Generate favicons for the root directory
echo "Generating favicon-16x16.png..."
convert "$BASE_IMAGE" -resize 16x16 "public/favicon-16x16.png"

echo "Generating favicon-32x32.png..."
convert "$BASE_IMAGE" -resize 32x32 "public/favicon-32x32.png"

# Generate apple-touch-icon
echo "Generating apple-touch-icon.png..."
convert "$BASE_IMAGE" -resize 180x180 -background none -gravity center -extent 180x180 "$ICONS_DIR/apple-touch-icon.png"

# Generate .ico file with multiple sizes
echo "Generating favicon.ico..."
convert "$BASE_IMAGE" -resize 16x16 "$BASE_IMAGE" -resize 32x32 "$BASE_IMAGE" -resize 48x48 "public/favicon.ico"

echo "Done! All favicons have been generated."
echo ""
echo "Generated files:"
ls -la public/icons/icon-*.png
ls -la public/icons/web-app-manifest-*.png
ls -la public/favicon*.png
ls -la public/favicon.ico