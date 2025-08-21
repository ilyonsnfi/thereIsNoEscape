#!/bin/bash

# Script to package Chrome extension for Web Store submission

echo "Packaging Chrome extension for Web Store..."

# Remove old ZIP if it exists
rm -f halo-esc-blocker.zip

# Create ZIP with only the required extension files
zip -r halo-esc-blocker.zip \
  manifest.json \
  content.js \
  popup.html \
  popup.js \
  icon-16.png \
  icon-48.png \
  icon-128.png

echo "Package created: halo-esc-blocker.zip"
echo "Contents:"
zipinfo -1 halo-esc-blocker.zip

echo ""
echo "Ready for Chrome Web Store upload!"