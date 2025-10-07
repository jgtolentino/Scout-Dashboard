import React, { useState } from 'react';
import { Tabs, Tab } from './Tabs';
import ColorPicker from './ColorPicker';
import StyleEditor from './StyleEditor';
import PropertyField from './PropertyField';
import EventEditor from './EventEditor';
import ChildrenEditor from './ChildrenEditor';
import { PROPERTY_TYPES } from '../constants/propertyTypes';
import '../styles/PropertyPanel.css';

const PropertyPanel = ({ 
  component, 
  onPropertyChange, 
  onRemoveComponent,
  componentTypes 
}) => {
  const [activeTab, setActiveTab] = useState('properties');
  
  if (!component) {
    return (
      <div className="property-panel empty-panel">
        <p>Select a component to edit its properties</p>
      </div>
    );
  }
  
  const componentType = componentTypes[component.type] || {};
  const { properties = {}, events = {}, styles = {}, childrenAllowed = false } = componentType;
  
  const handlePropertyChange = (key, value) => {
    onPropertyChange({ props: { ...component.props, [key]: value } });
  };
  
  const handleStyleChange = (style) => {
    onPropertyChange({ styles: { ...component.styles, ...style } });
  };

  const handleEventChange = (eventName, code) => {
    const updatedEvents = { ...component.events, [eventName]: code };
    onPropertyChange({ events: updatedEvents });
  };
  
  const handleChildrenChange = (children) => {
    onPropertyChange({ children });
  };
  
  return (
    <div className="property-panel">
      <div className="panel-header">
        <h3>{componentType.name || component.type}</h3>
        <div className="panel-actions">
          <button 
            className="remove-component-btn"
            onClick={onRemoveComponent}
            title="Remove component"
          >
            Remove
          </button>
        </div>
      </div>
      
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="properties" label="Properties">
          <div className="properties-container">
            {Object.entries(properties).map(([propName, config]) => {
              const propType = config.type || 'string';
              const propValue = component.props?.[propName] !== undefined 
                ? component.props[propName] 
                : config.default;
                
              return (
                <PropertyField
                  key={propName}
                  name={propName}
                  label={config.label || propName}
                  type={propType}
                  value={propValue}
                  options={config.options}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  onChange={(value) => handlePropertyChange(propName, value)}
                  tooltip={config.description}
                />
              );
            })}
            
            {Object.keys(properties).length === 0 && (
              <p className="no-properties-message">
                This component has no editable properties
              </p>
            )}
          </div>
        </Tab>
        
        <Tab id="styles" label="Styles">
          <StyleEditor 
            styles={component.styles || {}}
            onChange={handleStyleChange}
            availableStyles={styles}
          />
        </Tab>
        
        <Tab id="events" label="Events">
          <EventEditor
            events={component.events || {}}
            availableEvents={events}
            onChange={handleEventChange}
          />
        </Tab>
        
        {childrenAllowed && (
          <Tab id="children" label="Children">
            <ChildrenEditor
              children={component.children || []}
              onChange={handleChildrenChange}
              componentTypes={componentTypes}
            />
          </Tab>
        )}
        
        <Tab id="advanced" label="Advanced">
          <div className="advanced-properties">
            <h4>Component ID</h4>
            <input 
              type="text" 
              value={component.id} 
              disabled 
              className="id-display"
            />
            
            <h4>Raw JSON</h4>
            <div className="json-editor">
              <pre>{JSON.stringify(component, null, 2)}</pre>
            </div>
            
            <div className="advanced-actions">
              <button onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(component, null, 2));
              }}>
                Copy JSON
              </button>
              <button onClick={() => {
                try {
                  const jsonValue = prompt("Paste component JSON:", JSON.stringify(component, null, 2));
                  if (jsonValue) {
                    const parsed = JSON.parse(jsonValue);
                    onPropertyChange(parsed);
                  }
                } catch (error) {
                  alert("Invalid JSON format");
                }
              }}>
                Edit Raw JSON
              </button>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default PropertyPanel;