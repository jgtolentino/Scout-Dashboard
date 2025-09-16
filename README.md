# Scout Analytics Dashboard - GitHub Pages Redirect

[![Redirect Status](https://img.shields.io/badge/Redirect-Active-brightgreen)](https://jgtolentino.github.io/suqi-analytics/)
[![Target Platform](https://img.shields.io/badge/Target-Vercel-black)](https://scout-dashboard-deploy.vercel.app/)

This repository contains a redirect page for the Scout Analytics Dashboard, replacing the legacy `suqi-public` static site.

## Overview

The Scout Analytics Dashboard has been migrated from static GitHub Pages to a dynamic Next.js application hosted on Vercel. This repository maintains a redirect to ensure backward compatibility.

## Redirect Details

- **From**: `https://jgtolentino.github.io/suqi-analytics/` (GitHub Pages)
- **To**: `https://scout-dashboard-deploy.vercel.app/` (Vercel Production)

## Features

- Instant meta refresh redirect (0 seconds)
- JavaScript fallback redirect (1 second)
- Modern loading UI with spinner
- Mobile-responsive design
- SEO-friendly canonical URL

## Deployment

This redirect is automatically deployed to GitHub Pages when changes are pushed to the `gh-pages` branch.

## Migration History

1. **Legacy**: Static HTML/CSS/JS dashboard on GitHub Pages
2. **Current**: Dynamic Next.js application with Supabase backend on Vercel
3. **Redirect**: This repository maintains backward compatibility

## Technical Details

- **Framework**: Static HTML
- **Hosting**: GitHub Pages
- **Redirect Method**: Meta refresh + JavaScript
- **Performance**: Sub-second redirect time

---

Part of the Scout v7 Analytics Platform migration.