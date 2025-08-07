"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  XMarkIcon, 
  PhoneIcon,
  TagIcon 
} from '@heroicons/react/24/outline';
import { validatePhoneNumber } from '@/utils/validation';

export interface PhoneEntry {
  number: string;
  label: string;
  id: string;
}

interface PhoneNumbersFieldProps {
  value: PhoneEntry[];
  onChange: (phones: PhoneEntry[]) => void;
  className?: string;
}

export default function PhoneNumbersField({ 
  value = [], 
  onChange,
  className = ""
}: PhoneNumbersFieldProps) {
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPhone = () => {
    if (!newNumber.trim()) {
      setValidationMessage('Phone number is required');
      return;
    }

    // Validate phone number
    const validation = validatePhoneNumber(newNumber);
    if (!validation.isValid) {
      setValidationMessage(validation.errors?.[0] || 'Invalid phone number');
      return;
    }

    // Check for duplicates
    const formattedNumber = validation.formatted || newNumber;
    if (value.some(p => p.number === formattedNumber)) {
      setValidationMessage('This phone number already exists');
      return;
    }

    // Add the new phone entry
    const newEntry: PhoneEntry = {
      id: Date.now().toString(),
      number: formattedNumber,
      label: newLabel.trim() || 'Primary'
    };

    onChange([...value, newEntry]);
    
    // Reset form
    setNewNumber('');
    setNewLabel('');
    setValidationMessage('');
    setIsAdding(false);
  };

  const handleRemovePhone = (id: string) => {
    onChange(value.filter(p => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPhone();
    }
  };

  // Add a phone from enrichment
  const addEnrichmentPhone = (phoneNumber: string, label: string = 'Default') => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) return;

    const formattedNumber = validation.formatted || phoneNumber;
    
    // Check if already exists
    if (value.some(p => p.number === formattedNumber)) {
      return;
    }

    const newEntry: PhoneEntry = {
      id: Date.now().toString(),
      number: formattedNumber,
      label: label
    };

    onChange([...value, newEntry]);
  };

  // Note: The addEnrichmentPhone method is exposed via the ref-forwarded component below

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Existing phone numbers */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((phone) => (
            <div 
              key={phone.id}
              className="flex items-center gap-2 p-2 sm:p-3 bg-light-background-secondary dark:bg-gray-800 rounded-lg border border-light-border dark:border-gray-700"
            >
              <PhoneIcon className="h-4 w-4 text-light-text-secondary dark:text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-sm font-medium text-light-text-primary dark:text-white truncate">
                    {phone.number}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full self-start sm:self-auto">
                    {phone.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePhone(phone.id)}
                className="p-1 text-light-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label={`Remove ${phone.label} phone`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new phone form */}
      {isAdding ? (
        <div className="p-3 sm:p-4 bg-light-background-secondary dark:bg-gray-800 rounded-lg border-2 border-flash-green/20 dark:border-flash-green/30">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-light-text-secondary dark:text-gray-400 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  value={newNumber}
                  onChange={(e) => {
                    setNewNumber(e.target.value);
                    setValidationMessage('');
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="(876) 555-0100"
                  className="w-full text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-light-text-secondary dark:text-gray-400 mb-1">
                  Label <span className="text-light-text-tertiary">(Optional)</span>
                </label>
                <Input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Mobile, Office, WhatsApp"
                  className="w-full text-sm"
                />
              </div>
            </div>

            {validationMessage && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {validationMessage}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddPhone}
                className="flex-1 sm:flex-none bg-flash-green hover:bg-flash-green/90 text-white text-sm py-1.5"
              >
                Add Phone
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewNumber('');
                  setNewLabel('');
                  setValidationMessage('');
                }}
                variant="outline"
                className="flex-1 sm:flex-none text-sm py-1.5"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-flash-green hover:text-flash-green/80 border border-dashed border-flash-green/30 hover:border-flash-green/50 rounded-lg transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="h-4 w-4" />
          Add Phone Number
        </button>
      )}

      {/* Help text */}
      {value.length === 0 && !isAdding && (
        <p className="text-xs text-light-text-tertiary dark:text-gray-500">
          Add one or more phone numbers for this business
        </p>
      )}
    </div>
  );
}

// Export a ref-forwarded version for parent components to use
export const PhoneNumbersFieldWithRef = React.forwardRef<
  { addEnrichmentPhone: (phone: string, label?: string) => void },
  PhoneNumbersFieldProps
>((props, ref) => {
  const { value = [], onChange } = props;
  
  React.useImperativeHandle(ref, () => ({
    addEnrichmentPhone: (phoneNumber: string, label: string = 'Default') => {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) return;

      const formattedNumber = validation.formatted || phoneNumber;
      
      // Check if already exists
      if (value.some(p => p.number === formattedNumber)) {
        return;
      }

      const newEntry: PhoneEntry = {
        id: Date.now().toString(),
        number: formattedNumber,
        label: label
      };

      onChange([...value, newEntry]);
    }
  }), [value, onChange]);

  return <PhoneNumbersField {...props} />;
});

PhoneNumbersFieldWithRef.displayName = 'PhoneNumbersFieldWithRef';