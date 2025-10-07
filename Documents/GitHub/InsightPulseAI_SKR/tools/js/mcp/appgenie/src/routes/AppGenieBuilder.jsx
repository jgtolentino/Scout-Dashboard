import React, { useState, useEffect } from 'react';
import DevicePreview from '../components/mobile/DevicePreview';
import ComponentPalette from '../components/mobile/ComponentPalette';
import ScreenNavigator from '../components/mobile/ScreenNavigator';
import PropertyEditor from '../components/mobile/PropertyEditor';
import '../styles/AppGenieBuilder.css';

/**
 * AppGenieBuilder - Rork-style mobile app builder interface
 * Handles the specific UI and functionality for building mobile applications
 */
const AppGenieBuilder = ({ projectName, isLoading }) => {
  const [screens, setScreens] = useState([
    { id: 'welcome', name: 'Welcome' },
    { id: 'home', name: 'Home' }
  ]);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [components, setComponents] = useState({});
  const [device, setDevice] = useState('iphone');
  
  // Load screen components on screen change
  useEffect(() => {
    if (isLoading) return;
    
    // In a real implementation, this would load components from the app schema
    // For now, we'll use mock data
    const mockComponents = {
      welcome: [
        { id: 'logo', type: 'Image', props: { source: 'logo.png', width: 200, height: 200 } },
        { id: 'title', type: 'Text', props: { content: projectName || 'Welcome', fontSize: 24 } },
        { id: 'subtitle', type: 'Text', props: { content: 'Mobile App', fontSize: 16 } },
        { id: 'getStarted', type: 'Button', props: { label: 'Get Started', variant: 'primary' } }
      ],
      home: [
        { id: 'header', type: 'Text', props: { content: 'Home Screen', fontSize: 20 } },
        { id: 'container', type: 'Container', props: { direction: 'column' } }
      ]
    };
    
    setComponents(mockComponents);
  }, [currentScreen, isLoading, projectName]);
  
  // Handle component selection
  const handleSelectComponent = (componentId) => {
    setSelectedComponent(componentId);
  };
  
  // Handle component property change
  const handlePropertyChange = (componentId, propertyName, value) => {
    setComponents(prev => {
      const screenComponents = [...(prev[currentScreen] || [])];
      const componentIndex = screenComponents.findIndex(c => c.id === componentId);
      
      if (componentIndex >= 0) {
        screenComponents[componentIndex] = {
          ...screenComponents[componentIndex],
          props: {
            ...screenComponents[componentIndex].props,
            [propertyName]: value
          }
        };
      }
      
      return {
        ...prev,
        [currentScreen]: screenComponents
      };
    });
  };
  
  // Handle adding a new component
  const handleAddComponent = (componentType) => {
    const newComponentId = `${componentType.toLowerCase()}_${Date.now()}`;
    
    // Default props based on component type
    const defaultProps = {
      Text: { content: 'New Text', fontSize: 16 },
      Button: { label: 'Button', variant: 'primary' },
      Image: { source: 'placeholder.png', width: 100, height: 100 },
      Container: { direction: 'column' },
      Input: { placeholder: 'Enter text...', label: 'Input' },
      List: { data: [] }
    };
    
    const newComponent = {
      id: newComponentId,
      type: componentType,
      props: defaultProps[componentType] || {}
    };
    
    setComponents(prev => ({
      ...prev,
      [currentScreen]: [...(prev[currentScreen] || []), newComponent]
    }));
    
    setSelectedComponent(newComponentId);
  };
  
  // Handle adding a new screen
  const handleAddScreen = () => {
    const screenName = prompt('Enter screen name:');
    if (!screenName) return;
    
    const screenId = screenName.toLowerCase().replace(/\s+/g, '_');
    
    setScreens(prev => [
      ...prev,
      { id: screenId, name: screenName }
    ]);
    
    setCurrentScreen(screenId);
    setComponents(prev => ({
      ...prev,
      [screenId]: []
    }));
  };
  
  // Handle changing the device preview
  const handleDeviceChange = (newDevice) => {
    setDevice(newDevice);
  };
  
  // Handle deleting a component
  const handleDeleteComponent = (componentId) => {
    if (!componentId) return;
    
    setComponents(prev => {
      const screenComponents = [...(prev[currentScreen] || [])];
      const updatedComponents = screenComponents.filter(c => c.id !== componentId);
      
      return {
        ...prev,
        [currentScreen]: updatedComponents
      };
    });
    
    setSelectedComponent(null);
  };
  
  return (
    <div className="app-genie-builder">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Creating your mobile app...</div>
        </div>
      ) : (
        <>
          <div className="builder-sidebar left">
            <ScreenNavigator 
              screens={screens}
              currentScreen={currentScreen}
              onScreenChange={setCurrentScreen}
              onAddScreen={handleAddScreen}
            />
            <ComponentPalette onAddComponent={handleAddComponent} />
          </div>
          
          <div className="builder-main">
            <div className="device-controls">
              <select 
                value={device} 
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="device-selector"
              >
                <option value="iphone">iPhone</option>
                <option value="android">Android</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            
            <DevicePreview 
              device={device}
              components={components[currentScreen] || []}
              selectedComponent={selectedComponent}
              onSelectComponent={handleSelectComponent}
            />
          </div>
          
          <div className="builder-sidebar right">
            <PropertyEditor 
              component={components[currentScreen]?.find(c => c.id === selectedComponent)}
              onPropertyChange={handlePropertyChange}
              onDeleteComponent={handleDeleteComponent}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AppGenieBuilder;