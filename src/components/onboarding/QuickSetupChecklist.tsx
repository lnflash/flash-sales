import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useRouter } from 'next/router';

export default function QuickSetupChecklist() {
  const router = useRouter();
  const { 
    isActive, 
    currentStep,
    quickSetupTasks,
    completeQuickSetupTask,
    completeOnboarding,
    previousStep
  } = useOnboardingStore();

  const isOpen = isActive && currentStep === 'quick-setup';
  const completedCount = quickSetupTasks.filter(task => task.completed).length;
  const totalCount = quickSetupTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleTaskClick = (taskId: string) => {
    // Mark task as completed
    completeQuickSetupTask(taskId);

    // Navigate to relevant page based on task
    switch (taskId) {
      case 'profile':
        router.push('/dashboard/settings');
        break;
      case 'notifications':
        router.push('/dashboard/settings#notifications');
        break;
      case 'first-activity':
        router.push('/dashboard/weekly-program');
        break;
      case 'territory':
        router.push('/dashboard/leads');
        break;
      case 'team-setup':
        router.push('/dashboard/rep-tracking');
        break;
      case 'goals':
        router.push('/dashboard/weekly-program');
        break;
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push('/dashboard');
  };

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-flash-green/10">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-flash-green" />
                  </div>
                  <div className="ml-4">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6 text-gray-900"
                    >
                      Quick Setup Checklist
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      Complete these tasks to get your account fully set up
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{completedCount} of {totalCount} completed</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-flash-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-3 mb-6">
                  {quickSetupTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`relative rounded-lg border-2 p-4 transition-all ${
                        task.completed
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => !task.completed && handleTaskClick(task.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {task.completed ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className={`text-sm font-medium ${
                            task.completed ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            task.completed ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {task.description}
                          </p>
                        </div>
                        {!task.completed && (
                          <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completion Message */}
                {completedCount === totalCount && totalCount > 0 && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-900">
                          Congratulations! You've completed all setup tasks.
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          You're ready to start using Flash Sales Dashboard to its full potential!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
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
                    className={`inline-flex justify-center rounded-md border border-transparent px-6 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-flash-green focus-visible:ring-offset-2 ${
                      completedCount === totalCount
                        ? 'bg-flash-green hover:bg-flash-green-light'
                        : 'bg-gray-400 hover:bg-gray-500'
                    }`}
                    onClick={handleFinish}
                  >
                    {completedCount === totalCount ? 'Finish Setup 🎉' : 'Finish Later'}
                  </button>
                </div>

                {/* Skip Info */}
                <p className="text-xs text-center text-gray-500 mt-4">
                  You can complete these tasks anytime from your settings
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}