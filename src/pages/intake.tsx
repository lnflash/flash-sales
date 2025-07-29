import IntakeForm from '@/components/intake/IntakeForm';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-light-bg-secondary">
      {/* Simple Header */}
      <header className="bg-white border-b border-light-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-light-text-secondary hover:text-light-text-primary transition-colors">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-flash-green rounded-full flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="text-lg font-semibold text-light-text-primary">Flash Sales</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <IntakeForm />
      </main>
    </div>
  );
}