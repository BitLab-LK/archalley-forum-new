/**
 * Submissions Page
 * Shows user's competition registrations and allows creating submissions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubmissionsClient } from './submissions-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'My Submissions - Archalley',
  description: 'View your competition registrations and create submissions',
};

/**
 * Get submission period status
 * Returns: 'not_started' | 'active' | 'ended'
 * 
 * Submission starts: 11th December 2025
 * Kids deadline: 24th December 2025
 * Other categories deadline: 24th December 2025
 */
function getSubmissionPeriodStatus(): 'not_started' | 'active' | 'ended' {
  const now = new Date();
  
  // Start: December 11, 2025, 00:00:00 (Sri Lanka timezone UTC+5:30)
  const startDate = new Date('2025-12-11T00:00:00+05:30');
  
  // End: December 24, 2025, 23:59:59 (latest deadline for non-kids categories)
  const endDate = new Date('2025-12-24T23:59:59+05:30');
  
  if (now < startDate) {
    return 'not_started';
  } else if (now > endDate) {
    return 'ended';
  } else {
    return 'active';
  }
}

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/submissions');
  }

  // Admins and super admins can access anytime
  const userRole = session.user.role as string;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // For non-admin users, check submission period status
  if (!isAdmin) {
    const periodStatus = getSubmissionPeriodStatus();
    
    if (periodStatus === 'not_started') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Submission Has Not Started Yet</CardTitle>
              <CardDescription>
                The submission period has not begun
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2">Submission Period Details</p>
                    <ul className="space-y-1.5">
                      <li>
                        <span className="font-medium">Submission start:</span> 11th December 2025
                      </li>
                      <li>
                        <span className="font-medium">Submission deadline for kids' category:</span> 24th December 2025
                      </li>
                      <li>
                        <span className="font-medium">Submission deadline for other categories:</span> 24th December 2025
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please check back when the submission period begins.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (periodStatus === 'ended') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Submission Period Closed</CardTitle>
              <CardDescription>
                The submission period has ended
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-2">Submission Period Details</p>
                    <ul className="space-y-1.5">
                      <li>
                        <span className="font-medium">Submission start:</span> 11th December 2025
                      </li>
                      <li>
                        <span className="font-medium">Submission deadline for kids' category:</span> 24th December 2025
                      </li>
                      <li>
                        <span className="font-medium">Submission deadline for other categories:</span> 24th December 2025
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                The submission period has ended. Please check back next year.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <SubmissionsClient />;
}
