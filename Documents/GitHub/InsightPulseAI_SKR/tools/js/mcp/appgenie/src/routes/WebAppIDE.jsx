import React, { useState, useEffect } from 'react';
import FileExplorer from '../components/ide/FileExplorer';
import CodeEditor from '../components/ide/CodeEditor';
import PreviewPane from '../components/ide/PreviewPane';
import ToolbarIDE from '../components/ide/ToolbarIDE';
import ComponentLibrary from '../components/ide/ComponentLibrary';
import Terminal from '../components/ide/Terminal';
import '../styles/WebAppIDE.css';

/**
 * WebAppIDE - Replit-style web application builder interface
 * Handles the specific UI and functionality for building web applications
 */
const WebAppIDE = ({ projectName, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [viewMode, setViewMode] = useState('split'); // code, preview, split
  const [componentDrawerOpen, setComponentDrawerOpen] = useState(false);
  
  // Initialize project files
  useEffect(() => {
    if (isLoading) return;
    
    // In a real implementation, this would load files from the project
    // For now, we'll use mock data
    const initialFiles = [
      { id: 'index.html', name: 'index.html', type: 'html', path: '/' },
      { id: 'styles.css', name: 'styles.css', type: 'css', path: '/' },
      { id: 'main.js', name: 'main.js', type: 'javascript', path: '/' },
      { id: 'components/header.js', name: 'header.js', type: 'javascript', path: '/components' },
      { id: 'components/footer.js', name: 'footer.js', type: 'javascript', path: '/components' }
    ];
    
    const cleanProjectName = (projectName || 'MyWebsite').replace(/\s+/g, '');
    
    const initialContents = {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || 'My Web App'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header id="header"></header>
  
  <main>
    <h1>${projectName || 'Welcome to My Web App'}</h1>
    <p>This is a web application built with PulseDev.</p>
  </main>
  
  <footer id="footer"></footer>
  
  <script src="main.js"></script>
</body>
</html>`,
      'styles.css': `/* ${projectName || 'My Web App'} Styles */

:root {
  --primary-color: #4361ee;
  --secondary-color: #3f37c9;
  --accent-color: #4cc9f0;
  --text-color: #333;
  --bg-color: #fff;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  margin: 0;
  padding: 0;
}

header, footer {
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  padding: 1rem;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--primary-color);
}`,
      'main.js': `// ${projectName || 'My Web App'} JavaScript

// Import components
import { createHeader } from './components/header.js';
import { createFooter } from './components/footer.js';

// Initialize the application
function initApp() {
  // Render header and footer
  const headerElement = document.getElementById('header');
  const footerElement = document.getElementById('footer');
  
  if (headerElement) createHeader(headerElement);
  if (footerElement) createFooter(footerElement);
  
  console.log('${cleanProjectName} initialized successfully!');
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);`,
      'components/header.js': `// Header Component

export function createHeader(container) {
  container.innerHTML = \`
    <div class="header-container">
      <div class="logo">${cleanProjectName}</div>
      <nav>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Services</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
    </div>
  \`;
}`,
      'components/footer.js': `// Footer Component

export function createFooter(container) {
  const year = new Date().getFullYear();
  
  container.innerHTML = \`
    <div class="footer-container">
      <p>&copy; \${year} ${projectName || 'My Web App'}. All rights reserved.</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
    </div>
  \`;
}`
    };
    
    setFiles(initialFiles);
    setFileContents(initialContents);
    setActiveFile('index.html');
    
  }, [isLoading, projectName]);
  
  // Handle file selection
  const handleFileSelect = (fileId) => {
    setActiveFile(fileId);
  };
  
  // Handle file content change
  const handleFileContentChange = (fileId, content) => {
    setFileContents(prev => ({
      ...prev,
      [fileId]: content
    }));
  };
  
  // Handle creating a new file
  const handleCreateFile = () => {
    const fileName = prompt('Enter file name (include extension):');
    if (!fileName) return;
    
    const filePathParts = fileName.split('/');
    const actualFileName = filePathParts.pop();
    const filePath = filePathParts.length > 0 ? `/${filePathParts.join('/')}` : '/';
    
    // Determine file type from extension
    const extension = actualFileName.split('.').pop().toLowerCase();
    let fileType = 'text';
    
    if (['html', 'htm'].includes(extension)) fileType = 'html';
    else if (['css'].includes(extension)) fileType = 'css';
    else if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) fileType = 'javascript';
    else if (['json'].includes(extension)) fileType = 'json';
    else if (['md'].includes(extension)) fileType = 'markdown';
    
    const newFileId = fileName.replace(/\//g, '_');
    
    // Create the new file
    const newFile = {
      id: newFileId,
      name: actualFileName,
      type: fileType,
      path: filePath
    };
    
    setFiles(prev => [...prev, newFile]);
    
    // Initialize file content
    setFileContents(prev => ({
      ...prev,
      [newFileId]: ''
    }));
    
    // Select the new file
    setActiveFile(newFileId);
  };
  
  // Handle deleting a file
  const handleDeleteFile = (fileId) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;
    
    if (!confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) return;
    
    // Remove the file
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Remove its content
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[fileId];
      return newContents;
    });
    
    // If the active file was deleted, select another file
    if (activeFile === fileId) {
      setActiveFile(files.length > 1 ? files[0].id : null);
    }
  };
  
  // Handle running the project
  const handleRunProject = () => {
    setTerminalVisible(true);
    setTerminalOutput('Starting development server...\n');
    
    // Simulate server output
    setTimeout(() => {
      setTerminalOutput(prev => prev + 'Compiling...\n');
      
      setTimeout(() => {
        setTerminalOutput(prev => prev + 'Server running at http://localhost:3000\n');
      }, 500);
    }, 500);
    
    // Switch to preview mode
    setViewMode('preview');
  };
  
  // Handle changing view mode
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };
  
  // Handle toggling the component drawer
  const handleToggleComponentDrawer = () => {
    setComponentDrawerOpen(prev => !prev);
  };
  
  // Handle changing preview device mode
  const handlePreviewModeChange = (mode) => {
    setPreviewMode(mode);
  };
  
  return (
    <div className="webapp-ide">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Creating your web application...</div>
        </div>
      ) : (
        <>
          <ToolbarIDE 
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onRun={handleRunProject}
            onNewFile={handleCreateFile}
            previewMode={previewMode}
            onPreviewModeChange={handlePreviewModeChange}
            onToggleComponentDrawer={handleToggleComponentDrawer}
          />
          
          <div className="ide-main">
            <FileExplorer 
              files={files}
              activeFile={activeFile}
              onSelectFile={handleFileSelect}
              onDeleteFile={handleDeleteFile}
              onCreateFile={handleCreateFile}
            />
            
            <div className="ide-content">
              {viewMode === 'code' || viewMode === 'split' ? (
                <CodeEditor 
                  file={files.find(f => f.id === activeFile)}
                  content={fileContents[activeFile] || ''}
                  onChange={(content) => handleFileContentChange(activeFile, content)}
                  className={viewMode === 'split' ? 'split-view' : ''}
                />
              ) : null}
              
              {viewMode === 'preview' || viewMode === 'split' ? (
                <PreviewPane 
                  files={fileContents}
                  previewMode={previewMode}
                  className={viewMode === 'split' ? 'split-view' : ''}
                />
              ) : null}
            </div>
            
            {componentDrawerOpen && (
              <ComponentLibrary 
                onSelectComponent={(component) => {
                  // Handle inserting component into active file
                  if (activeFile && activeFile.endsWith('.html')) {
                    // Logic to insert component code at cursor position
                    alert(`Inserting ${component} component`);
                  }
                }}
              />
            )}
          </div>
          
          {terminalVisible && (
            <Terminal 
              output={terminalOutput}
              onClose={() => setTerminalVisible(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WebAppIDE;