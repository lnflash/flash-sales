import React, { useCallback, useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboardLayoutStore } from '@/stores/useDashboardLayoutStore';
import { widgetComponents } from './widgets';
import { DEFAULT_WIDGETS } from '@/types/dashboard-layout';
import { Button } from '@/components/ui/button';
import { 
  PencilIcon, 
  XMarkIcon, 
  PlusIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardGrid: React.FC = () => {
  const { 
    layouts, 
    activeLayoutId, 
    isEditMode, 
    updateLayout,
    toggleEditMode 
  } = useDashboardLayoutStore();
  
  const [showAddWidget, setShowAddWidget] = useState(false);
  
  const activeLayout = layouts.find(l => l.id === activeLayoutId) || layouts[0];
  const currentLayoutItems = activeLayout?.items || [];
  
  // Convert our layout format to react-grid-layout format
  const gridLayouts = {
    lg: currentLayoutItems.map(item => ({ ...item, i: item.id })),
    md: currentLayoutItems.map(item => ({ ...item, i: item.id, w: Math.min(item.w, 10) })),
    sm: currentLayoutItems.map(item => ({ ...item, i: item.id, w: Math.min(item.w, 6) })),
    xs: currentLayoutItems.map(item => ({ ...item, i: item.id, w: 4, h: item.h })),
    xxs: currentLayoutItems.map(item => ({ ...item, i: item.id, w: 2, h: item.h }))
  };

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!isEditMode || !activeLayoutId) return;
    
    // Convert react-grid-layout format back to our format
    const updatedItems = layout.map(item => {
      const originalItem = currentLayoutItems.find(original => original.id === item.i);
      return {
        id: item.i!,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: originalItem?.minW,
        minH: originalItem?.minH,
        maxW: originalItem?.maxW,
        maxH: originalItem?.maxH
      };
    });
    
    updateLayout(activeLayoutId, updatedItems);
  }, [isEditMode, activeLayoutId, updateLayout, currentLayoutItems]);

  const removeWidget = (widgetId: string) => {
    if (!activeLayoutId) return;
    
    const newItems = currentLayoutItems.filter(item => item.id !== widgetId);
    updateLayout(activeLayoutId, newItems);
  };

  const addWidget = (widgetId: string) => {
    if (!activeLayoutId) return;
    
    // Find the widget definition
    const widget = DEFAULT_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;
    
    // Find a position for the new widget
    const maxY = Math.max(...currentLayoutItems.map(item => item.y + item.h), 0);
    
    const newItem = {
      id: widgetId,
      x: 0,
      y: maxY,
      w: 6,
      h: 3,
      minW: 3,
      minH: 2
    };
    
    updateLayout(activeLayoutId, [...currentLayoutItems, newItem]);
    setShowAddWidget(false);
  };

  const availableWidgets = DEFAULT_WIDGETS.filter(
    widget => !currentLayoutItems.find(item => item.id === widget.id)
  );

  return (
    <div className="relative">
      {/* Edit Mode Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          <Button
            variant={isEditMode ? 'default' : 'secondary'}
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            <ViewColumnsIcon className="h-4 w-4" />
            {isEditMode ? 'Done Editing' : 'Customize Layout'}
          </Button>
        </div>
        
        {isEditMode && (
          <div className="flex items-center gap-2">
            {availableWidgets.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddWidget(!showAddWidget)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Widget
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Widget Menu */}
      {showAddWidget && isEditMode && (
        <div className="mb-4 p-4 bg-muted rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Available Widgets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableWidgets.map(widget => (
              <Button
                key={widget.id}
                variant="secondary"
                size="sm"
                onClick={() => addWidget(widget.id)}
                className="justify-start"
              >
                {widget.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className={`layout ${isEditMode ? 'edit-mode' : ''}`}
        layouts={gridLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {currentLayoutItems.map(item => {
          const widget = DEFAULT_WIDGETS.find(w => w.id === item.id);
          if (!widget) return null;
          
          const WidgetComponent = widgetComponents[widget.type];
          if (!WidgetComponent) return null;

          return (
            <div 
              key={item.id} 
              className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
            >
              {/* Widget Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-foreground">{widget.title}</h3>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWidget(item.id)}
                    className="h-6 w-6 p-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Widget Content */}
              <div className="p-4 h-[calc(100%-53px)]">
                <WidgetComponent config={widget.config} />
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg z-50">
          <p className="text-sm font-medium">
            Drag widgets to reposition • Drag corners to resize • Click Done when finished
          </p>
        </div>
      )}
    </div>
  );
};