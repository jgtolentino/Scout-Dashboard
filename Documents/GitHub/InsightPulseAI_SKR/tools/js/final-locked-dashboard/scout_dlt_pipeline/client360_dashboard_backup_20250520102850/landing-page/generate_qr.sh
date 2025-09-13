#!/bin/bash
# Script to generate QR code image

echo "Generating QR code image..."

# Create a basic QR code image using a simple approach (create a blank file)
mkdir -p images
touch images/qr-code.png

cat > images/README_QR.md << EOF
# QR Code Image

For the Client 360 landing page, you need to create a QR code image named \`qr-code.png\`.

## Options:

1. **Generate online**:
   - Visit a QR code generator website like https://www.qrcode-monkey.com/
   - Enter the URL for booking a demo or your calendar link
   - Download as PNG and save as \`images/qr-code.png\`

2. **Use the provided HTML template**:
   - Open \`images/qr-code.html\` in a browser
   - Take a screenshot
   - Save as \`images/qr-code.png\`

3. **Command line generation**:
   If you have \`qrencode\` installed:
   ```
   qrencode -o images/qr-code.png "https://calendly.com/your-booking-url"
   ```

The landing page will automatically use the QR code image at \`images/qr-code.png\`.
EOF

echo "Created instructions for QR code generation in images/README_QR.md"
echo "Please follow the instructions to create the actual QR code image."