'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Submission, LeadStatus } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import { getUserFromStorage } from '@/lib/auth';
import { getUserRole, hasPermission } from '@/types/roles';
import Link from 'next/link';
import { 
  PhoneIcon, 
  UserIcon, 
  CalendarIcon, 
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { AILeadScoreCard } from '@/components/dashboard/AILeadScoreCard';
import { useAILeadScoring } from '@/hooks/useAILeadScoring';
import { LeadScoreCard } from '@/components/dashboard/LeadScoreCard';
import { calculateLeadScore } from '@/utils/lead-scoring';

interface SubmissionDetailProps {
  submission: Submission;
  isLoading?: boolean;
}

export default function SubmissionDetail({ 
  submission, 
  isLoading = false 
}: SubmissionDetailProps) {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState({
    canEdit: false,
    canDelete: false
  });
  const [showAIScore, setShowAIScore] = useState(true);

  // Prepare lead data for AI scoring
  const leadData = submission ? {
    id: String(submission.id),
    ownerName: submission.ownerName,
    phoneNumber: submission.phoneNumber,
    email: submission.email,
    interestLevel: submission.interestLevel || 0,
    specificNeeds: submission.specificNeeds,
    territory: submission.territory,
    businessType: submission.businessType,
    monthlyRevenue: submission.monthlyRevenue,
    numberOfEmployees: submission.numberOfEmployees,
    painPoints: submission.painPoints || [],
    interactions: [] // Would come from activity tracking
  } : null;

  const { scoreData, isLoading: isLoadingScore } = useAILeadScoring(leadData);

  // Calculate basic score for fallback
  const basicScore = submission ? calculateLeadScore({
    monthlyRevenue: submission.monthlyRevenue || '',
    numberOfEmployees: submission.numberOfEmployees || '',
    yearEstablished: new Date().getFullYear().toString(),
    monthlyTransactions: '100',
    averageTicketSize: '50',
    interestLevel: submission.interestLevel || 0,
    painPoints: submission.painPoints || [],
    packageSeen: submission.packageSeen || false,
    signedUp: submission.signedUp || false,
    currentProcessor: submission.currentProcessor || '',
    businessType: submission.businessType || '',
  }) : 0;

  const breakdown = {
    demographic: 75,
    firmographic: 82,
    behavioral: 68
  };

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      const role = getUserRole(user.username);
      setUserPermissions({
        canEdit: hasPermission(role, 'canEditSubmissions'),
        canDelete: hasPermission(role, 'canDeleteSubmissions')
      });
    }
  }, []);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/dashboard/submissions');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md animate-pulse border border-light-border">
          <div className="h-8 bg-light-bg-tertiary rounded w-3/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-5 bg-light-bg-tertiary rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-light-bg-tertiary rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <Link
          href="/dashboard/submissions"
          className="inline-flex items-center text-flash-green hover:text-flash-green-light"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to submissions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main submission details - 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg overflow-hidden shadow-md border border-light-border">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-light-text-primary">{submission.ownerName}</h1>

            <div className="flex items-center mt-2 md:mt-0">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  submission.leadStatus === 'converted' || submission.signedUp
                    ? 'bg-flash-green/10 text-flash-green border border-flash-green/20'
                    : submission.leadStatus === 'qualified'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : submission.leadStatus === 'contacted'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : submission.leadStatus === 'new'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-light-text-secondary border border-light-border'
                }`}
              >
                {submission.leadStatus ? 
                  submission.leadStatus.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ') 
                  : (submission.signedUp ? 'Signed Up' : 'Canvas')
                }
              </span>

              {userPermissions.canEdit && (
                <Link
                  href={`/dashboard/submissions/${submission.id}/edit`}
                  className="ml-4 inline-flex items-center px-3 py-1 border border-amber-500 text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              )}
              
              {userPermissions.canDelete && (
                <button
                  onClick={handleDelete}
                  className="ml-2 inline-flex items-center px-3 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Business Name</h3>
              <p className="text-light-text-primary">{submission.ownerName}</p>
            </div>

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Phone Number</h3>
              <p className="text-light-text-primary flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-flash-green" />
                {submission.phoneNumber || 'None provided'}
              </p>
            </div>

            {submission.email && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Email</h3>
                <p className="text-light-text-primary">{submission.email}</p>
              </div>
            )}

            {submission.businessType && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Business Type</h3>
                <p className="text-light-text-primary">{submission.businessType}</p>
              </div>
            )}

            {submission.monthlyRevenue && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Monthly Revenue</h3>
                <p className="text-light-text-primary">{submission.monthlyRevenue}</p>
              </div>
            )}

            {submission.numberOfEmployees && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Number of Employees</h3>
                <p className="text-light-text-primary">{submission.numberOfEmployees}</p>
              </div>
            )}

            {submission.yearEstablished && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Year Established</h3>
                <p className="text-light-text-primary">{submission.yearEstablished}</p>
              </div>
            )}

            {submission.currentProcessor && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Current Processor</h3>
                <p className="text-light-text-primary">{submission.currentProcessor}</p>
              </div>
            )}

            {submission.monthlyTransactions && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Monthly Transactions</h3>
                <p className="text-light-text-primary">{submission.monthlyTransactions}</p>
              </div>
            )}

            {submission.averageTicketSize && (
              <div>
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Average Ticket Size</h3>
                <p className="text-light-text-primary">{submission.averageTicketSize}</p>
              </div>
            )}

            {submission.painPoints && submission.painPoints.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-light-text-secondary text-sm font-medium mb-1">Pain Points</h3>
                <div className="flex flex-wrap gap-2">
                  {submission.painPoints.map((point, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-light-bg-secondary text-light-text-primary border border-light-border"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Sales Rep</h3>
              <p className="text-light-text-primary flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-flash-green" />
                {submission.username || 'Anonymous'}
              </p>
            </div>

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Territory</h3>
              <p className="text-light-text-primary">{submission.territory || 'N/A'}</p>
            </div>

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Submission Date</h3>
              <p className="text-light-text-primary flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-flash-green" />
                {formatDate(submission.timestamp)}
              </p>
            </div>

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Interest Level</h3>
              <div className="flex items-center">
                <div className="w-1/2 bg-light-bg-tertiary rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                    style={{ width: `${(submission.interestLevel / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2">{submission.interestLevel}/5</span>
              </div>
            </div>

            <div>
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Package Seen by Owner</h3>
              <p className={`${submission.packageSeen ? 'text-flash-green' : 'text-light-text-tertiary'}`}>
                {submission.packageSeen ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Other Decision Makers</h3>
              <p className="text-light-text-primary flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2 text-flash-green flex-shrink-0" />
                {submission.decisionMakers || 'None specified'}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-light-text-secondary text-sm font-medium mb-1">Specific Needs</h3>
              <div className="bg-light-bg-secondary rounded-md p-4 mt-1 border border-light-border">
                <div className="flex">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-flash-green flex-shrink-0" />
                  <p className="text-light-text-primary">
                    {submission.specificNeeds || 'No specific needs provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>

        {/* AI Lead Score Card - 1 column on large screens */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-light-text-primary">Lead Intelligence</h2>
            <button
              onClick={() => setShowAIScore(!showAIScore)}
              className="text-sm text-flash-green hover:text-flash-green-light"
            >
              {showAIScore ? 'Show Basic' : 'Show AI Score'}
            </button>
          </div>
          
          {showAIScore && scoreData ? (
            <AILeadScoreCard
              score={scoreData.score}
              confidence={scoreData.confidence}
              factors={scoreData.factors}
              predictedOutcome={scoreData.predictedOutcome}
              recommendations={scoreData.recommendations}
              historicalComparison={scoreData.historicalComparison}
              breakdown={breakdown}
              trend="stable"
              lastUpdated={new Date().toISOString()}
            />
          ) : (
            <LeadScoreCard
              score={basicScore}
              breakdown={breakdown}
              trend="stable"
              lastUpdated={new Date().toISOString()}
            />
          )}
        </div>
      </div>
    </div>
  );
}