import React, { useState } from 'react';
import { useDashboardLayoutStore } from '@/stores/useDashboardLayoutStore';
import { LAYOUT_PRESETS } from '@/types/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Cog6ToothIcon, 
  PlusIcon, 
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export const LayoutManager: React.FC = () => {
  const { 
    layouts, 
    activeLayoutId, 
    setActiveLayout, 
    addLayout, 
    deleteLayout,
    duplicateLayout,
    resetToPreset
  } = useDashboardLayoutStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleCreateLayout = () => {
    if (!newLayoutName.trim()) return;
    
    const preset = selectedPreset ? LAYOUT_PRESETS.find(p => p.id === selectedPreset) : LAYOUT_PRESETS[0];
    
    addLayout({
      name: newLayoutName,
      items: preset?.layout || [],
      isDefault: false
    });
    
    setNewLayoutName('');
    setSelectedPreset(null);
    setIsOpen(false);
  };

  const handleDuplicateLayout = (layoutId: string, layoutName: string) => {
    const newName = prompt('Enter name for duplicated layout:', `${layoutName} (Copy)`);
    if (newName) {
      duplicateLayout(layoutId, newName);
    }
  };

  const activeLayout = layouts.find(l => l.id === activeLayoutId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Cog6ToothIcon className="h-4 w-4" />
          Manage Layouts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Layouts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Layouts */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Your Layouts</h3>
            <div className="space-y-2">
              {layouts.map(layout => (
                <div 
                  key={layout.id}
                  className={`
                    p-3 rounded-lg border flex items-center justify-between
                    ${layout.id === activeLayoutId 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-background border-border hover:border-muted-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground">{layout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {layout.items.length} widgets
                        {layout.isDefault && ' • Default'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {layout.id !== activeLayoutId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveLayout(layout.id)}
                      >
                        <CheckIcon className="h-4 w-4" />
                        Use
                      </Button>
                    )}
                    
                    {!layout.isDefault && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateLayout(layout.id, layout.name)}
                          title="Duplicate layout"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${layout.name}"?`)) {
                              deleteLayout(layout.id);
                            }
                          }}
                          title="Delete layout"
                        >
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Layout */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Create New Layout</h3>
            
            <div className="space-y-3">
              <Input
                placeholder="Layout name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
              />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Start from preset:</p>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`
                        p-3 rounded-lg border text-left transition-colors
                        ${selectedPreset === preset.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border hover:border-muted-foreground'
                        }
                      `}
                    >
                      <p className="font-medium text-sm text-foreground">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleCreateLayout}
                disabled={!newLayoutName.trim()}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Layout
              </Button>
            </div>
          </div>

          {/* Reset Current Layout */}
          {activeLayout && !activeLayout.isDefault && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Reset Current Layout</h3>
              <div className="flex flex-wrap gap-2">
                {LAYOUT_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Reset "${activeLayout.name}" to ${preset.name} preset?`)) {
                        resetToPreset(preset.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};