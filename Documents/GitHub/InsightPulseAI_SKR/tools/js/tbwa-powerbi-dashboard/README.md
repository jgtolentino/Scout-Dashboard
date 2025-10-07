# TBWA Retail Advisor Dashboard

A Power BI-inspired dashboard for TBWA Retail Advisor with modern React, Tailwind CSS, and Chart.js.

## Features

- 🎨 TBWA-branded design system with yellow (#FFCF00) accent color
- 📊 Interactive charts with Chart.js (bar, line, doughnut)
- 🔄 Data source toggle between simulated and real-time data
- 📱 Responsive layout for all device sizes
- 🧩 Modular component architecture
- 📁 Data export functionality (CSV, JSON, Excel)
- 🎛️ Filter controls for data customization

## Tech Stack

- **React + Vite**: Fast development and optimized production builds
- **Tailwind CSS**: Utility-first styling with custom TBWA theme
- **Zustand**: Lightweight state management
- **Chart.js**: Powerful, responsive charts with TBWA styling
- **Headless UI**: Accessible UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd tbwa-powerbi-dashboard

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

### Building for Production

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Deployment

The dashboard is designed to be deployed to Azure Static Web Apps. A deployment script is provided:

```bash
# Make the script executable
chmod +x deploy_to_azure.sh

# Run the deployment script
./deploy_to_azure.sh
```

The script will:
1. Install dependencies
2. Build the project
3. Guide you through Azure Static Web App deployment

## Project Structure

```
tbwa-powerbi-dashboard/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── store/          # Zustand state management
│   ├── App.jsx         # Main application component
│   ├── index.css       # Global styles and Tailwind CSS
│   └── main.jsx        # Application entry point
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Customization

### Colors

TBWA brand colors are defined in `tailwind.config.js`:

```js
colors: {
  'tbwa-yellow': '#FFCF00',
  'tbwa-black': '#000000',
  // Additional colors...
}
```

### Data Sources

To connect to real data sources:
1. Edit the API endpoint in `src/store/dataStore.js`
2. Update the data transformation logic to match your API response format

## License

This project is owned by TBWA and is not open for public use without permission.

## Acknowledgements

- [Chart.js](https://www.chartjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Headless UI](https://headlessui.dev/)