# Multi-Mode UI Architecture for Pulser

This document explains the integrated frontend shell architecture with modular rendering modes that has been implemented for the Pulser platform.

## Overview

The architecture provides a unified interface for multiple UI modes while keeping their logic and components separate. This allows users to seamlessly switch between different UI modes without losing the shared context and navigation.

## UI Modes

| Mode    | UX Style      | Use Case                      | Route          |
|---------|---------------|-------------------------------|----------------|
| deck    | Gamma-style   | SlideForge (decks, docs)      | `/build/deck`  |
| webapp  | Replit-style  | PulseDev (landing pages, tools) | `/build/webapp` |
| mobile  | Rork-style    | AppGenie (mobile apps)        | `/build/mobile` |

## Architecture

The architecture uses a shared shell component (`AppShell.jsx`) that manages the routing, state, and navigation across all modes. Each mode has its own dedicated route component that handles its specific UI and functionality.

```jsx
<AppShell>
  {mode === 'deck' && <DeckBuilder />}
  {mode === 'ide' && <WebAppIDE />}
  {mode === 'mobile' && <AppGenieBuilder />}
</AppShell>
```

### Benefits

- **Shared State**: Authentication, project metadata, and general UI state are shared across all modes.
- **Clean Routing**: Users can easily switch between modes with URL-based routing.
- **Isolated Complexity**: Each mode's specific logic and UI components are contained within their respective modules.
- **Consistent UI**: Common elements like navigation, sidebars, and status bars are consistent across all modes.

## Component Structure

```
src/
├── App.jsx                # Main application component with routing
├── AppShell.jsx           # Shared shell component with mode switching
├── routes/
│   ├── DeckBuilder.jsx    # Gamma-style presentation builder
│   ├── WebAppIDE.jsx      # Replit-style web IDE
│   └── AppGenieBuilder.jsx # Rork-style mobile app builder
├── components/
│   ├── shared/            # Components shared across all modes
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatusBar.jsx
│   │   └── IntentAnalyzer.jsx
│   ├── deck/              # Deck-specific components
│   ├── ide/               # IDE-specific components
│   └── mobile/            # Mobile-specific components
└── styles/                # CSS styles for components
```

## Intent-Based Mode Selection

The architecture includes an intent analyzer component that uses Claude to automatically detect the appropriate mode based on the user's prompt. This allows users to describe what they want to build in natural language, and the system will automatically route them to the most appropriate mode.

```javascript
// Intent detection logic in AppShell.jsx
const handleIntentAnalysis = async (prompt) => {
  // Detect mode based on prompt keywords
  const lowerPrompt = prompt.toLowerCase();
  let detectedMode = 'mobile'; // Default mode
  
  if (lowerPrompt.includes('presentation') || 
      lowerPrompt.includes('slide') || 
      lowerPrompt.includes('deck')) {
    detectedMode = 'deck';
  } else if (lowerPrompt.includes('website') || 
             lowerPrompt.includes('landing page') || 
             lowerPrompt.includes('webapp')) {
    detectedMode = 'webapp';
  } else if (lowerPrompt.includes('app') || 
             lowerPrompt.includes('mobile') || 
             lowerPrompt.includes('ios') || 
             lowerPrompt.includes('android')) {
    detectedMode = 'mobile';
  }
  
  // Switch to the detected mode
  navigate(`/build/${detectedMode}`);
};
```

## Implementation Details

### Shared Components

- **Navbar**: Top navigation with mode switcher and project controls.
- **Sidebar**: Left sidebar with mode-specific tools and navigation.
- **StatusBar**: Bottom status bar with contextual information.
- **IntentAnalyzer**: Modal for analyzing user prompts to determine the appropriate mode.

### Mode-Specific Components

Each mode has its own set of specialized components:

- **Deck Mode**: SlideEditor, SlideList, SlidePreview, ThemeSelector, etc.
- **WebApp Mode**: FileExplorer, CodeEditor, PreviewPane, Terminal, etc.
- **Mobile Mode**: DevicePreview, ComponentPalette, ScreenNavigator, PropertyEditor, etc.

## Styling

Each mode has its own theme variables, but they share a common styling structure:

```css
.app-shell.deck-mode {
  --primary-color: #684cb4;
  --accent-color: #ff9800;
  /* other variables */
}

.app-shell.webapp-mode {
  --primary-color: #1976d2;
  --accent-color: #03a9f4;
  /* other variables */
}

.app-shell.mobile-mode {
  --primary-color: #2e7d32;
  --accent-color: #4caf50;
  /* other variables */
}
```

## Usage Example

The multi-mode architecture can be used in different ways:

### URL-Based Navigation

Users can directly access specific modes via URLs:
- `/build/deck` - Opens the presentation builder
- `/build/webapp` - Opens the web app IDE
- `/build/mobile` - Opens the mobile app builder

### Modal Prompt

Users can create a new project using the "New Project" button, which opens an intent analyzer modal. They can type what they want to build in natural language, and the system will detect the appropriate mode.

### Mode Switcher

The navbar includes mode switcher buttons that allow users to switch between modes at any time.

## Future Enhancements

Potential future enhancements for the multi-mode architecture:

1. **Shared Components Library**: A central library of UI components that can be used across all modes.
2. **Projects Database**: A shared database for storing project metadata and content.
3. **Conversion Utilities**: Tools for converting projects between different modes.
4. **Unified Export Options**: Standard export formats that work across all modes.
5. **Plugin System**: A plugin architecture that allows extending functionality across all modes.

## Conclusion

The multi-mode architecture provides a flexible and user-friendly way to integrate multiple build tools under a single interface. By keeping the UI shell unified while separating the mode-specific logic, we gain the benefits of integration without the complexity of fully merging disparate interfaces.