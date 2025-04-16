'use client';

import { Submission } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import Link from 'next/link';
import { 
  PhoneIcon, 
  UserIcon, 
  CalendarIcon, 
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface SubmissionDetailProps {
  submission: Submission;
  isLoading?: boolean;
}

export default function SubmissionDetail({ 
  submission, 
  isLoading = false 
}: SubmissionDetailProps) {
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md animate-pulse">
          <div className="h-8 bg-flash-dark-2 rounded w-3/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-5 bg-flash-dark-2 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-flash-dark-2 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Link
          href="/dashboard/submissions"
          className="inline-flex items-center text-flash-green hover:text-flash-green-light"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to submissions
        </Link>
      </div>

      <div className="bg-flash-dark-3 rounded-lg overflow-hidden shadow-md">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{submission.ownerName}</h1>

            <div className="flex items-center mt-2 md:mt-0">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  submission.signedUp
                    ? 'bg-flash-green/20 text-flash-green'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {submission.signedUp ? 'Signed Up' : 'Prospect'}
              </span>

              <Link
                href={`/dashboard/submissions/${submission.id}/edit`}
                className="ml-4 inline-flex items-center px-3 py-1 border border-flash-yellow text-flash-yellow rounded-md hover:bg-flash-yellow hover:text-flash-dark-1 transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Business Name</h3>
              <p className="text-white">{submission.ownerName}</p>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Phone Number</h3>
              <p className="text-white flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-flash-green" />
                {submission.phoneNumber || 'None provided'}
              </p>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Sales Rep</h3>
              <p className="text-white flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-flash-green" />
                {submission.username || 'Anonymous'}
              </p>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Submission Date</h3>
              <p className="text-white flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-flash-green" />
                {formatDate(submission.timestamp)}
              </p>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Interest Level</h3>
              <div className="flex items-center">
                <div className="w-1/2 bg-flash-dark-2 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                    style={{ width: `${(submission.interestLevel / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2">{submission.interestLevel}/5</span>
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Package Seen by Owner</h3>
              <p className={`${submission.packageSeen ? 'text-flash-green' : 'text-gray-400'}`}>
                {submission.packageSeen ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Other Decision Makers</h3>
              <p className="text-white flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2 text-flash-green flex-shrink-0" />
                {submission.decisionMakers || 'None specified'}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Specific Needs</h3>
              <div className="bg-flash-dark-2 rounded-md p-4 mt-1">
                <div className="flex">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-flash-green flex-shrink-0" />
                  <p className="text-white">
                    {submission.specificNeeds || 'No specific needs provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}