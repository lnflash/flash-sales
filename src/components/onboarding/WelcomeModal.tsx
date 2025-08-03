import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export default function WelcomeModal() {
  const { 
    isActive, 
    currentStep, 
    skipOnboarding, 
    nextStep 
  } = useOnboardingStore();

  const isOpen = isActive && currentStep === 'welcome';

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-flash-green/10">
                      <SparklesIcon className="h-6 w-6 text-flash-green" />
                    </div>
                  </div>
                  <button
                    onClick={skipOnboarding}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-2"
                >
                  Welcome to Flash Sales Dashboard! 🎉
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    We're excited to have you here! This quick tour will help you get the most out of your new sales platform.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                          <span className="text-sm font-medium text-blue-600">1</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Choose your role</p>
                        <p className="text-sm text-gray-500">Get a personalized experience based on your responsibilities</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100">
                          <span className="text-sm font-medium text-purple-600">2</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Interactive tour</p>
                        <p className="text-sm text-gray-500">Learn about key features with guided walkthroughs</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                          <span className="text-sm font-medium text-green-600">3</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Quick setup</p>
                        <p className="text-sm text-gray-500">Complete a few tasks to get your account ready</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Tip:</span> You can restart this tour anytime from the Help menu
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={skipOnboarding}
                  >
                    Skip Tour
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-flash-green px-4 py-2 text-sm font-medium text-white hover:bg-flash-green-light focus:outline-none focus-visible:ring-2 focus-visible:ring-flash-green focus-visible:ring-offset-2"
                    onClick={nextStep}
                  >
                    Let's Get Started! →
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