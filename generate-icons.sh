#!/bin/bash

# Script to generate Chrome extension icons from SVG

echo "Generating Chrome extension icons..."

# Remove old PNG files
rm -f icon-*.png

# Try sips first for direct SVG conversion
if sips -s format png icon-base.svg --out icon-128.png --resampleWidth 128 --resampleHeight 128 2>/dev/null; then
    echo "Used sips for SVG conversion"
else
    echo "Sips failed, falling back to Quick Look..."
    # Generate 128px PNG using Quick Look
    qlmanage -t -s 128 -o . icon-base.svg
    # Rename the generated file
    mv icon-base.svg.png icon-128.png
fi

# Generate smaller sizes using sips
sips -z 48 48 icon-128.png --out icon-48.png
sips -z 16 16 icon-128.png --out icon-16.png

echo "Generated icons:"
ls -la icon-*.png

echo "Icons ready for Chrome Web Store!"