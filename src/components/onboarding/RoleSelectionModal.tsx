import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  UserIcon, 
  UserGroupIcon, 
  CogIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { useOnboardingStore, UserRole } from '@/stores/useOnboardingStore';
import { WELCOME_MESSAGES } from '@/types/onboarding';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'sales-rep',
    title: 'Sales Representative',
    description: 'I manage leads and close deals',
    icon: UserIcon,
    features: [
      'Personal dashboard',
      'Lead management',
      'Program of Work',
      'Performance tracking'
    ]
  },
  {
    id: 'sales-manager',
    title: 'Sales Manager',
    description: 'I lead a team of sales reps',
    icon: UserGroupIcon,
    features: [
      'Team dashboard',
      'Rep tracking',
      'Territory management',
      'Team analytics'
    ]
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'I manage the system and users',
    icon: CogIcon,
    features: [
      'Full system access',
      'User management',
      'Configuration',
      'Advanced reports'
    ]
  }
];

export default function RoleSelectionModal() {
  const { 
    isActive, 
    currentStep, 
    selectedRole,
    setRole,
    nextStep,
    previousStep 
  } = useOnboardingStore();

  const [tempSelectedRole, setTempSelectedRole] = useState<UserRole | null>(selectedRole);

  const isOpen = isActive && currentStep === 'role-selection';

  const handleContinue = () => {
    if (tempSelectedRole) {
      setRole(tempSelectedRole);
      nextStep();
    }
  };

  const selectedRoleData = tempSelectedRole ? WELCOME_MESSAGES[tempSelectedRole] : null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-2"
                >
                  What's your role?
                </Dialog.Title>
                
                <p className="text-sm text-gray-500 mb-6">
                  Select your role to get a personalized experience tailored to your needs
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    const isSelected = tempSelectedRole === role.id;
                    
                    return (
                      <button
                        key={role.id}
                        onClick={() => setTempSelectedRole(role.id)}
                        className={`relative rounded-lg border-2 p-6 text-left transition-all ${
                          isSelected 
                            ? 'border-flash-green bg-flash-green/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-flash-green">
                              <CheckIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <Icon className={`h-8 w-8 ${
                            isSelected ? 'text-flash-green' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                          {role.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {role.description}
                        </p>
                        
                        <ul className="space-y-1">
                          {role.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-xs text-gray-600">
                              <span className="mr-1">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {selectedRoleData && tempSelectedRole && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {selectedRoleData.title}
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      {selectedRoleData.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRoleData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start text-sm text-blue-700">
                          <CheckIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={previousStep}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={!tempSelectedRole}
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-flash-green focus-visible:ring-offset-2 ${
                      tempSelectedRole
                        ? 'bg-flash-green hover:bg-flash-green-light'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    onClick={handleContinue}
                  >
                    Continue →
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}