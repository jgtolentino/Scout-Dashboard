#!/bin/bash
# Build JavaScript components

# Create components directory if it doesn't exist
mkdir -p dist/js/components

# Copy components
echo "Building store map component..."
cp -f src/components/store_map.js dist/js/components/

echo "Components built successfully"