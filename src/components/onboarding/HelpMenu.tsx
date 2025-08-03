import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  QuestionMarkCircleIcon,
  SparklesIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export default function HelpMenu() {
  const { resetOnboarding, startOnboarding } = useOnboardingStore();

  const handleRestartTour = () => {
    resetOnboarding();
    setTimeout(() => {
      startOnboarding();
    }, 100);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-flash-green">
          <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleRestartTour}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <SparklesIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Restart Onboarding Tour
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <BookOpenIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Documentation
                </a>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/support"
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <ChatBubbleLeftRightIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Contact Support
                </a>
              )}
            </Menu.Item>
            
            <div className="border-t border-gray-100 my-1" />
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => window.location.reload()}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <ArrowPathIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Refresh Page
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}