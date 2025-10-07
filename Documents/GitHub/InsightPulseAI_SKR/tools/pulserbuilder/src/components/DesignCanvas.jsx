import React, { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import GridLayout from 'react-grid-layout';
import ComponentRenderer from './ComponentRenderer';
import { resizeGrid } from '../utils/layoutHelpers';
import '../styles/DesignCanvas.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DesignCanvas = ({
  components,
  selectedComponentId,
  onSelectComponent,
  onMoveComponent,
  onRemoveComponent,
  viewMode,
  zoomLevel
}) => {
  const [gridWidth, setGridWidth] = useState(12); // 12-column grid
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [devicePreview, setDevicePreview] = useState('desktop'); // desktop, tablet, mobile
  const canvasRef = useRef(null);
  const gridRef = useRef(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'COMPONENT',
    drop: (item, monitor) => {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const dropPoint = monitor.getClientOffset();
      
      // Calculate drop position relative to canvas
      const x = dropPoint.x - canvasRect.left;
      const y = dropPoint.y - canvasRect.top;
      
      // Convert position to grid coordinates
      const gridX = Math.floor(x / (canvasRect.width / gridWidth));
      const gridY = Math.floor(y / 50); // Assuming row height is 50px
      
      return {
        x: gridX,
        y: gridY
      };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Update canvas size based on container size and device preview
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const containerWidth = canvasRef.current.parentElement.clientWidth;
        let width = containerWidth;
        
        // Adjust for device preview
        switch (devicePreview) {
          case 'mobile':
            width = 375;
            setGridWidth(4);
            break;
          case 'tablet':
            width = 768;
            setGridWidth(8);
            break;
          case 'desktop':
          default:
            width = containerWidth;
            setGridWidth(12);
            break;
        }
        
        // Apply zoom
        width = width * (zoomLevel / 100);
        
        setCanvasSize({
          width,
          height: canvasRef.current.parentElement.clientHeight
        });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [devicePreview, zoomLevel]);

  // Convert components to layout items for GridLayout
  const layoutItems = components.map(component => ({
    i: component.id,
    x: component.layout?.x || 0,
    y: component.layout?.y || 0,
    w: component.layout?.w || 2,
    h: component.layout?.h || 1,
    minW: component.layout?.minW || 1,
    minH: component.layout?.minH || 1,
    maxW: component.layout?.maxW || gridWidth,
    maxH: component.layout?.maxH || 20,
    isDraggable: viewMode === 'edit',
    isResizable: viewMode === 'edit',
  }));

  // Handle layout change
  const handleLayoutChange = (newLayout) => {
    components.forEach(component => {
      const layoutItem = newLayout.find(item => item.i === component.id);
      if (layoutItem) {
        const { x, y, w, h } = layoutItem;
        if (
          x !== component.layout.x ||
          y !== component.layout.y ||
          w !== component.layout.w ||
          h !== component.layout.h
        ) {
          onMoveComponent(component.id, { x, y, w, h });
        }
      }
    });
  };

  // Handle device preview change
  const handleDevicePreviewChange = (device) => {
    setDevicePreview(device);
  };

  return (
    <div 
      className={`design-canvas-container ${viewMode} ${isOver ? 'drop-target' : ''}`} 
      ref={canvasRef}
    >
      <div className="canvas-controls">
        <div className="device-preview-controls">
          <button
            className={devicePreview === 'desktop' ? 'active' : ''}
            onClick={() => handleDevicePreviewChange('desktop')}
          >
            Desktop
          </button>
          <button
            className={devicePreview === 'tablet' ? 'active' : ''}
            onClick={() => handleDevicePreviewChange('tablet')}
          >
            Tablet
          </button>
          <button
            className={devicePreview === 'mobile' ? 'active' : ''}
            onClick={() => handleDevicePreviewChange('mobile')}
          >
            Mobile
          </button>
        </div>
        
        <div className="canvas-metadata">
          {viewMode === 'edit' ? 'Edit Mode' : viewMode === 'preview' ? 'Preview Mode' : 'Code View'}
          •
          {zoomLevel}%
        </div>
      </div>
      
      <div 
        className={`canvas-scroll-area ${devicePreview}-preview`}
        style={{ 
          zoom: zoomLevel / 100, 
          width: devicePreview === 'desktop' ? '100%' : `${canvasSize.width}px`,
        }}
        ref={drop}
      >
        <div className="canvas-content" ref={gridRef}>
          {components.length === 0 ? (
            <div className="empty-canvas">
              <p>Drag components here or generate from a prompt</p>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={layoutItems}
              cols={gridWidth}
              rowHeight={50}
              width={canvasSize.width}
              onLayoutChange={handleLayoutChange}
              compactType="vertical"
              preventCollision={false}
              isDroppable={viewMode === 'edit'}
              margin={[10, 10]}
            >
              {components.map(component => (
                <div key={component.id}>
                  <ComponentRenderer
                    component={component}
                    isSelected={component.id === selectedComponentId}
                    onSelect={() => onSelectComponent(component.id)}
                    onRemove={() => onRemoveComponent(component.id)}
                    editMode={viewMode === 'edit'}
                  />
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignCanvas;