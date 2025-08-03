import React, { useState, useEffect } from 'react';
import { useCRMEntities, CRMEntity } from '@/hooks/useCRMEntities';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface EntitySelectorProps {
  value?: {
    organizationId?: string;
    dealId?: string;
    contactId?: string;
    entityName?: string;
  };
  onChange: (value: {
    organizationId?: string;
    dealId?: string;
    contactId?: string;
    entityName?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  value,
  onChange,
  placeholder = "Search organizations, contacts, or deals...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<CRMEntity | null>(null);
  
  const { entities, isLoading } = useCRMEntities(searchTerm);

  // Set initial selected entity based on value
  useEffect(() => {
    if (value?.entityName) {
      setSelectedEntity({
        id: value.dealId || value.contactId || value.organizationId || '',
        type: value.dealId ? 'deal' : value.contactId ? 'contact' : 'organization',
        name: value.entityName,
        icon: value.dealId ? 'document' : value.contactId ? 'user' : 'building'
      });
    }
  }, [value]);

  const handleSelect = (entity: CRMEntity) => {
    setSelectedEntity(entity);
    setIsOpen(false);
    setSearchTerm('');

    // Clear all IDs first, then set the selected one
    const newValue: {
      organizationId?: string;
      dealId?: string;
      contactId?: string;
      entityName?: string;
    } = {
      organizationId: undefined,
      dealId: undefined,
      contactId: undefined,
      entityName: entity.name
    };

    switch (entity.type) {
      case 'organization':
        newValue.organizationId = entity.id;
        break;
      case 'contact':
        newValue.contactId = entity.id;
        break;
      case 'deal':
        newValue.dealId = entity.id;
        break;
    }

    onChange(newValue);
  };

  const handleClear = () => {
    setSelectedEntity(null);
    setSearchTerm('');
    onChange({
      organizationId: undefined,
      dealId: undefined,
      contactId: undefined,
      entityName: undefined
    });
  };

  const getIcon = (icon: CRMEntity['icon']) => {
    switch (icon) {
      case 'building':
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      case 'document':
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Entity or Search Input */}
      {selectedEntity ? (
        <div className="flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {getIcon(selectedEntity.icon)}
            </span>
            <span className="text-foreground">{selectedEntity.name}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pl-9 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedEntity && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : entities.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? 'No results found' : 'Type to search or select from recent items'}
            </div>
          ) : (
            <div className="py-1">
              {!searchTerm && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  Recent
                </div>
              )}
              {entities.map((entity) => (
                <button
                  key={`${entity.type}-${entity.id}`}
                  type="button"
                  onClick={() => handleSelect(entity)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted text-left"
                >
                  <span className="text-muted-foreground">
                    {getIcon(entity.icon)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {entity.name}
                    </div>
                    {entity.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">
                        {entity.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {entity.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};