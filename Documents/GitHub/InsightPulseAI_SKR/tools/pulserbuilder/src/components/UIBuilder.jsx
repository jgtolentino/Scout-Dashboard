import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentLibrary from './ComponentLibrary';
import DesignCanvas from './DesignCanvas';
import PropertyPanel from './PropertyPanel';
import ActionToolbar from './ActionToolbar';
import { useUIState } from '../hooks/useUIState';
import { useAgentCommunication } from '../hooks/useAgentCommunication';
import { generateUniqueId } from '../utils/helpers';
import { COMPONENT_TYPES } from '../constants/componentTypes';
import '../styles/UIBuilder.css';

/**
 * Main UI Builder component that orchestrates the entire UI generation experience
 */
const UIBuilder = ({ initialPrompt, projectId }) => {
  const { 
    uiState, 
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    clearCanvas,
    saveState,
    loadState
  } = useUIState(projectId);
  
  const {
    generateFromPrompt,
    generateComponent,
    isGenerating,
    lastResponse,
    generationError
  } = useAgentCommunication();
  
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // edit, preview, code
  const [zoomLevel, setZoomLevel] = useState(100);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Initialize UI generation if an initial prompt is provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== '') {
      handleGenerateFromPrompt(initialPrompt);
    }
  }, [initialPrompt]);
  
  // Update history when UI state changes
  useEffect(() => {
    if (uiState && Object.keys(uiState).length > 0) {
      // Don't add to history if we're navigating through history
      if (historyIndex === history.length - 1 || historyIndex === -1) {
        const newHistory = [...history, JSON.stringify(uiState)];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [uiState]);
  
  const handleGenerateFromPrompt = async (prompt) => {
    try {
      const result = await generateFromPrompt(prompt);
      if (result && result.components) {
        // Clear canvas before adding new components
        clearCanvas();
        
        // Add each component from the generated UI
        result.components.forEach(component => {
          addComponent({
            id: generateUniqueId(),
            type: component.type,
            props: component.props || {},
            children: component.children || [],
            layout: component.layout || { x: 0, y: 0, w: 12, h: 2 },
            styles: component.styles || {}
          });
        });
      }
    } catch (error) {
      console.error('Error generating UI from prompt:', error);
    }
  };
  
  const handleComponentSelect = (componentId) => {
    setSelectedComponentId(componentId);
  };
  
  const handlePropertyChange = (propertyUpdates) => {
    if (selectedComponentId) {
      updateComponent(selectedComponentId, propertyUpdates);
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadState(JSON.parse(history[newIndex]));
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadState(JSON.parse(history[newIndex]));
    }
  };
  
  const handleExportCode = () => {
    // Logic to export the current UI as React code
    const codeOutput = generateReactCode(uiState);
    // Handle the generated code (e.g., display in a modal, offer download)
  };
  
  const handleSaveProject = () => {
    saveState();
    // Additional logic for saving project metadata
  };
  
  const handleZoomChange = (newZoomLevel) => {
    setZoomLevel(newZoomLevel);
  };

  const selectedComponent = selectedComponentId ? 
    uiState.components.find(c => c.id === selectedComponentId) : null;
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="ui-builder">
        <ActionToolbar 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onSave={handleSaveProject}
          onExportCode={handleExportCode}
          onZoomChange={handleZoomChange}
          zoomLevel={zoomLevel}
          isGenerating={isGenerating}
        />
        
        <div className="ui-builder-main">
          <ComponentLibrary 
            onSelectComponent={(type) => {
              const newId = generateUniqueId();
              addComponent({
                id: newId,
                type,
                props: COMPONENT_TYPES[type].defaultProps || {},
                children: [],
                layout: { x: 0, y: 0, w: 6, h: 2 },
                styles: {}
              });
              setSelectedComponentId(newId);
            }}
            onGenerateComponent={(prompt) => generateComponent(prompt)}
            isGenerating={isGenerating}
          />
          
          <DesignCanvas 
            components={uiState.components || []}
            selectedComponentId={selectedComponentId}
            onSelectComponent={handleComponentSelect}
            onMoveComponent={moveComponent}
            onRemoveComponent={removeComponent}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
          />
          
          {selectedComponent && (
            <PropertyPanel 
              component={selectedComponent}
              onPropertyChange={handlePropertyChange}
              onRemoveComponent={() => removeComponent(selectedComponentId)}
              componentTypes={COMPONENT_TYPES}
            />
          )}
        </div>
        
        {generationError && (
          <div className="generation-error">
            {generationError.message || 'Error generating UI'}
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default UIBuilder;