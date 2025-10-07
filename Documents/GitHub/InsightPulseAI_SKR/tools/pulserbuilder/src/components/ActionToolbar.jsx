import React, { useState } from 'react';
import {
  UndoIcon,
  RedoIcon,
  SaveIcon,
  ExportIcon,
  PreviewIcon,
  CodeIcon,
  EditIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PublishIcon,
  SettingsIcon,
  GenerateIcon
} from '../icons';
import PromptModal from './PromptModal';
import '../styles/ActionToolbar.css';

const ActionToolbar = ({
  viewMode,
  setViewMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExportCode,
  onZoomChange,
  zoomLevel,
  onGenerateFromPrompt,
  isGenerating
}) => {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'react',
    includeStyles: true,
    optimizeForProduction: false
  });

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50);
    onZoomChange(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange(100);
  };

  const handleGenerateUI = (prompt) => {
    onGenerateFromPrompt(prompt);
    setShowPromptModal(false);
  };

  const handleExportCode = () => {
    onExportCode(exportOptions);
    setShowExportModal(false);
  };

  return (
    <div className="action-toolbar">
      <div className="toolbar-section logo-section">
        <h2 className="app-logo">PulserBuilder</h2>
      </div>

      <div className="toolbar-section view-controls">
        <button
          className={`view-control-btn ${viewMode === 'edit' ? 'active' : ''}`}
          onClick={() => setViewMode('edit')}
          title="Edit Mode"
        >
          <EditIcon />
          Edit
        </button>
        <button
          className={`view-control-btn ${viewMode === 'preview' ? 'active' : ''}`}
          onClick={() => setViewMode('preview')}
          title="Preview Mode"
        >
          <PreviewIcon />
          Preview
        </button>
        <button
          className={`view-control-btn ${viewMode === 'code' ? 'active' : ''}`}
          onClick={() => setViewMode('code')}
          title="Code View"
        >
          <CodeIcon />
          Code
        </button>
      </div>

      <div className="toolbar-section history-controls">
        <button
          className="toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <UndoIcon />
        </button>
        <button
          className="toolbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <RedoIcon />
        </button>
      </div>

      <div className="toolbar-section zoom-controls">
        <button
          className="toolbar-btn"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 50}
          title="Zoom Out"
        >
          <ZoomOutIcon />
        </button>
        <button
          className="zoom-reset"
          onClick={handleZoomReset}
          title="Reset Zoom"
        >
          {zoomLevel}%
        </button>
        <button
          className="toolbar-btn"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 200}
          title="Zoom In"
        >
          <ZoomInIcon />
        </button>
      </div>

      <div className="toolbar-section actions">
        <button
          className="toolbar-btn generate-btn"
          onClick={() => setShowPromptModal(true)}
          disabled={isGenerating}
          title="Generate from Description"
        >
          <GenerateIcon />
          {isGenerating ? "Generating..." : "Generate UI"}
        </button>
        <button
          className="toolbar-btn"
          onClick={onSave}
          title="Save Project"
        >
          <SaveIcon />
          Save
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setShowExportModal(true)}
          title="Export Code"
        >
          <ExportIcon />
          Export
        </button>
        <button
          className="toolbar-btn"
          onClick={() => {/* Publish functionality */}}
          title="Publish"
        >
          <PublishIcon />
          Publish
        </button>
        <button
          className="toolbar-btn settings-btn"
          onClick={() => {/* Settings functionality */}}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>

      {showPromptModal && (
        <PromptModal
          onSubmit={handleGenerateUI}
          onClose={() => setShowPromptModal(false)}
          title="Generate UI from Description"
          placeholder="Describe the UI you want to create..."
          isLoading={isGenerating}
          presets={[
            "A simple login form with email and password fields",
            "A dashboard with 4 analytics cards and a main chart",
            "A user profile page with avatar and editable details",
            "A product listing with filters and sorting options"
          ]}
        />
      )}

      {showExportModal && (
        <div className="modal export-modal">
          <div className="modal-content">
            <h3>Export Code</h3>
            <div className="export-options">
              <div className="option-group">
                <label>Format</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    format: e.target.value
                  })}
                >
                  <option value="react">React</option>
                  <option value="react-native">React Native</option>
                  <option value="vue">Vue</option>
                  <option value="angular">Angular</option>
                  <option value="html">HTML/CSS/JS</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeStyles}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeStyles: e.target.checked
                    })}
                  />
                  Include Styles
                </label>
              </div>
              
              <div className="option-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exportOptions.optimizeForProduction}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      optimizeForProduction: e.target.checked
                    })}
                  />
                  Optimize for Production
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleExportCode}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionToolbar;