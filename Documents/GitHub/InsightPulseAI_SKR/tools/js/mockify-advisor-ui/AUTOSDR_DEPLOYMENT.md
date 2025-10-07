# AutoSDR Landing Page Deployment

This document provides instructions for testing and deploying the new `/autosdr` landing page featuring Arkie, the AI-powered SDR agent.

## Testing Locally

1. Make sure you have all dependencies installed:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:5173/autosdr` in your browser to see the new page.

## Avatar Image

Before deploying, you need to add the Arkie avatar image:

1. Replace the placeholder file at `public/arkie-avatar-placeholder.txt` with an actual image
2. Name the image `arkie-avatar.png`
3. Recommended specifications:
   - Professional headshot style
   - Square aspect ratio (1:1)
   - Minimum size 500x500px
   - PNG format with transparency preferred

## Building for Production

1. Build the application for production:
   ```bash
   npm run build
   ```

2. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Deployment

### Vercel Deployment

If using Vercel for hosting:

1. Make sure your repository is connected to Vercel
2. Push your changes to the connected repository
3. Vercel will automatically build and deploy the updated site

### Manual Deployment

If using a different hosting solution:

1. Build the application as described above
2. Upload the contents of the `dist` directory to your web server
3. Ensure your server is configured to handle client-side routing (any requests should serve index.html)

## Verification

After deployment, verify:

1. The page is accessible at `https://yourdomain.com/autosdr`
2. The avatar image loads correctly
3. All buttons and links function properly
4. The page is responsive across different devices
5. Meta tags are correctly displayed when shared on social media

## Usage in Marketing

You can now use the URL `https://yourdomain.com/autosdr` in:

- LinkedIn articles and posts
- Email marketing campaigns
- Digital advertisements
- Sales outreach materials

## Questions or Issues

If you encounter any problems with the implementation, please contact the development team.