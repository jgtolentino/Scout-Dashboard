# Client360 Dashboard Landing Page

This directory contains marketing landing pages for the TBWA Client360 Dashboard. These landing pages are designed to showcase the features and benefits of the dashboard and drive interest in scheduling a demo.

## Directory Structure

```
landing-page/
├── README.md                 # This file
├── index.html                # Full featured HTML landing page
├── client-360.html           # Streamlined, copy-paste-ready landing page
├── css/                      # Stylesheets
│   └── styles.css            # Main CSS file
├── images/                   # Images directory
│   ├── dashboard-preview.html # HTML template for dashboard preview
│   ├── qr-code.html          # HTML template for QR code
│   └── README.md             # Instructions for creating preview image
├── generate_preview.sh       # Script to generate dashboard preview image
├── generate_qr.sh            # Script to generate QR code image
└── deploy.sh                 # Script to deploy the landing page
```

## Two Landing Page Options

### 1. Full-Featured Landing Page (`index.html`)

A comprehensive marketing page with:
- Responsive design with advanced layout
- Interactive components
- Contact form for lead generation
- Advanced styling with modern CSS
- Detailed feature breakdown

### 2. Copy-Paste-Ready Landing Page (`client-360.html`)

A streamlined, minimal-dependency page with:
- Clean HTML structure with inline styles
- Copy written by Kath in a concise, professional tone
- TBWA styling tokens built-in
- Easily embeddable in CMS blocks
- Live-preview link already wired in

## Features

- **Responsive Design**: Both pages are optimized for all device sizes
- **TBWA Branding**: Follow TBWA brand guidelines with appropriate color schemes
- **Feature Showcase**: Highlight key dashboard features
- **Clear Call-to-Action**: Drive demo requests
- **Brand-Consistent**: Maintain TBWA voice and visual identity

## Local Development

To view the landing pages locally:

1. Open either landing page in a web browser:
   ```
   open index.html
   # OR
   open client-360.html
   ```

2. To generate the dashboard preview image (optional):
   ```
   ./generate_preview.sh
   ```
   
3. To generate the QR code image (optional):
   ```
   ./generate_qr.sh
   ```

## Deployment

The landing pages can be deployed to Azure Static Web Apps:

1. Run the deployment script:
   ```
   ./deploy.sh
   ```

2. The script will:
   - Create a deployment package with both landing pages
   - Deploy to Azure Static Web Apps if configured
   - Generate a log file in `../logs/`

## Which Version to Use?

### Use `index.html` when:
- You need a highly interactive, feature-rich marketing page
- You have control over hosting and can include external CSS
- You want advanced interactive components
- You need a lead generation form built-in

### Use `client-360.html` when:
- You need to embed the page in a CMS or existing site
- You want to minimize external dependencies
- You prefer minimal, clean code that's easy to customize
- You want Kath's professionally crafted copy
- You need to copy-paste into another system

## Customization

### Colors and Branding

#### For index.html:
Edit the CSS variables in `css/styles.css`:
```css
:root {
  --primary-color: #ffc300;  /* TBWA yellow */
  --secondary-color: #000000;  /* TBWA black */
  --accent-color: #005bbb;  /* TBWA blue */
  ...
}
```

#### For client-360.html:
Edit the inline CSS variables:
```css
:root{
  --tbwa-blue:#0056FF;
  --tbwa-blue-dark:#0047B3;
  --tbwa-warning:#FFD300;
  ...
}
```

### Content Updates

#### For index.html:
Edit the various sections in the HTML file directly.

#### For client-360.html:
The content is organized into clearly commented sections that can be edited directly:
```html
<!-- HERO --------------------------------------------------- -->
<header class="section bg-blue" style="text-align:center">
  <h1 style="font-size:2.75rem;font-weight:700;margin:0 0 1rem">Client 360</h1>
  ...
</header>
```

## Integration with Main Dashboard

Both landing pages are designed to complement the TBWA-themed Client360 Dashboard. Update the demo/preview links to point to your deployed dashboard URL.

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Date: May 19, 2025