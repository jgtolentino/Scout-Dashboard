import React, { useContext, useEffect, useState, useRef } from 'react';
import { EditorContext } from '../context/EditorContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import axios from 'axios';
import './PreviewPane.css';

const PreviewPane = () => {
  const { workspace } = useContext(WorkspaceContext);
  const { activeFile, files } = useContext(EditorContext);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  // Check if the file is viewable
  const isViewable = (file) => {
    if (!file) return false;
    
    const extension = file.split('.').pop().toLowerCase();
    return ['html', 'md', 'svg', 'json', 'js', 'css'].includes(extension);
  };
  
  // Get preview for file
  const getPreview = async () => {
    if (!workspace?.id || !activeFile || !isViewable(activeFile)) {
      setPreviewUrl('');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/workspaces/${workspace.id}/preview`, {
        filePath: activeFile
      });
      
      setPreviewUrl(response.data.url);
    } catch (error) {
      console.error('Error getting preview:', error);
      setError(error.message || 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate preview content for HTML files
  const generateHtmlPreview = () => {
    if (!activeFile || !files[activeFile]) return '';
    
    const extension = activeFile.split('.').pop().toLowerCase();
    const content = files[activeFile].content;
    
    if (extension === 'html') {
      return content;
    } else if (extension === 'md') {
      // Simple markdown to HTML conversion
      return `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                color: #333;
              }
              pre {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
              }
              code {
                font-family: Menlo, Monaco, 'Courier New', monospace;
                font-size: 0.9em;
              }
              img {
                max-width: 100%;
              }
              h1, h2, h3, h4, h5, h6 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              p, ul, ol {
                margin-bottom: 16px;
              }
            </style>
          </head>
          <body>
            ${content.replace(/# (.+)/g, '<h1>$1</h1>')
              .replace(/## (.+)/g, '<h2>$1</h2>')
              .replace(/### (.+)/g, '<h3>$1</h3>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/\`(.+?)\`/g, '<code>$1</code>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
              .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')}
          </body>
        </html>
      `;
    } else if (extension === 'svg') {
      return `
        <html>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f5;">
            ${content}
          </body>
        </html>
      `;
    } else if (extension === 'json') {
      try {
        const jsonObj = JSON.parse(content);
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        return `
          <html>
            <head>
              <style>
                body {
                  font-family: Menlo, Monaco, 'Courier New', monospace;
                  line-height: 1.5;
                  padding: 20px;
                  margin: 0;
                  background-color: #1e1e1e;
                  color: #d4d4d4;
                }
                pre {
                  margin: 0;
                  white-space: pre-wrap;
                }
                .string { color: #ce9178; }
                .number { color: #b5cea8; }
                .boolean { color: #569cd6; }
                .null { color: #569cd6; }
                .key { color: #9cdcfe; }
              </style>
            </head>
            <body>
              <pre>${syntaxHighlightJson(formattedJson)}</pre>
            </body>
          </html>
        `;
      } catch (error) {
        return `
          <html>
            <body style="font-family:system-ui;padding:20px;color:#d32f2f;">
              <h3>Invalid JSON</h3>
              <p>${error.message}</p>
            </body>
          </html>
        `;
      }
    } else {
      return `
        <html>
          <body style="font-family:system-ui;padding:20px;color:#666;">
            <h3>Preview not available</h3>
            <p>No preview available for this file type.</p>
          </body>
        </html>
      `;
    }
  };
  
  // Syntax highlight JSON for display
  const syntaxHighlightJson = (json) => {
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        function (match) {
          let cls = 'number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key';
              match = match.replace(/:$/, '');
            } else {
              cls = 'string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean';
          } else if (/null/.test(match)) {
            cls = 'null';
          }
          return '<span class="' + cls + '">' + match + '</span>' + (cls === 'key' ? ':' : '');
        }
      );
  };
  
  // Update iframe content
  useEffect(() => {
    if (!iframeRef.current) return;
    
    if (previewUrl) {
      // Use external URL
      iframeRef.current.src = previewUrl;
    } else if (activeFile && files[activeFile] && isViewable(activeFile)) {
      // Generate content and set to iframe
      const htmlContent = generateHtmlPreview();
      const iframe = iframeRef.current;
      
      iframe.src = 'about:blank';
      setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }, 0);
    }
  }, [previewUrl, activeFile, files]);
  
  // Fetch preview URL when active file changes
  useEffect(() => {
    if (activeFile && isViewable(activeFile)) {
      getPreview();
    } else {
      setPreviewUrl('');
    }
  }, [activeFile]);
  
  if (!activeFile) {
    return (
      <div className="preview-pane empty-preview">
        <div className="preview-message">
          <div className="preview-icon">👁️</div>
          <h3>No file selected</h3>
          <p>Select a file to preview its contents.</p>
        </div>
      </div>
    );
  }
  
  if (!isViewable(activeFile)) {
    return (
      <div className="preview-pane empty-preview">
        <div className="preview-message">
          <div className="preview-icon">🤷‍♂️</div>
          <h3>Preview not available</h3>
          <p>This file type does not support preview.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="preview-pane">
      <div className="preview-header">
        <h3>Preview</h3>
        <div className="preview-actions">
          <button 
            className="preview-action-button"
            title="Refresh Preview"
            onClick={getPreview}
          >
            <i className="icon-refresh"></i>
          </button>
          {previewUrl && (
            <button 
              className="preview-action-button"
              title="Open in New Tab"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <i className="icon-external-link"></i>
            </button>
          )}
        </div>
      </div>
      
      <div className="preview-content">
        {isLoading && (
          <div className="preview-loading">
            <div className="spinner"></div>
            <p>Loading preview...</p>
          </div>
        )}
        
        {error && (
          <div className="preview-error">
            <div className="error-icon">⚠️</div>
            <h3>Error loading preview</h3>
            <p>{error}</p>
          </div>
        )}
        
        <iframe 
          ref={iframeRef}
          className="preview-iframe"
          title="File Preview"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>
  );
};

export default PreviewPane;