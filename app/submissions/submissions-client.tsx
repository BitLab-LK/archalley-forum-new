/**
 * Submissions Client Component
 * Displays user's registrations and submission forms
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategorySelector } from '@/components/submissions/category-selector';
import { FileUploadZone } from '@/components/submissions/file-upload-zone';
import { DescriptionCounter } from '@/components/submissions/description-counter';
import type { SubmissionCategory } from '@/types/submission';
import { toast } from 'sonner';

interface Registration {
  id: string;
  registrationNumber: string;
  competitionId: string;
  status: string;
  createdAt: string;
  competition: {
    id: string;
    title: string;
    submissionDeadline: string | null;
  };
  submission?: {
    id: string;
    submissionNumber: string;
    status: string;
    title: string;
    submissionCategory: string;
  } | null;
}

interface EligibilityResponse {
  canSubmit: boolean;
  reason: string;
}

export function SubmissionsClient() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Registration['submission'] | null>(null);

  // Form states
  const [category, setCategory] = useState<SubmissionCategory | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyPhoto, setKeyPhoto] = useState<File[]>([]);
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  const [documentFile, setDocumentFile] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/competitions/my-registrations');
      if (response.ok) {
        const result = await response.json();
        // Filter confirmed registrations only
        const confirmed = result.data.filter(
          (r: Registration) => r.status === 'CONFIRMED'
        );
        setRegistrations(confirmed);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (registrationId: string) => {
    try {
      const response = await fetch(
        `/api/competitions/check-eligibility?registrationId=${registrationId}`
      );
      const data: EligibilityResponse = await response.json();
      
      if (!data.canSubmit) {
        setEligibilityMessage(data.reason);
        return false;
      }
      
      setEligibilityMessage('');
      return true;
    } catch (error) {
      setEligibilityMessage('Failed to check eligibility');
      return false;
    }
  };

  const handleStartSubmission = async (registrationId: string) => {
    const isEligible = await checkEligibility(registrationId);
    if (isEligible) {
      setSelectedRegistration(registrationId);
      setShowForm(true);
      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setKeyPhoto([]);
      setAdditionalPhotos([]);
      setDocumentFile([]);
      setVideoFile([]);
      setError('');
      setEditingSubmission(null);
    }
  };

  const handleCancelSubmission = () => {
    setShowForm(false);
    setSelectedRegistration(null);
    setEditingSubmission(null);
    setEligibilityMessage('');
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      const isUpdating = editingSubmission !== null;
      
      console.log(isUpdating ? '📝 Updating submission...' : '✨ Creating new submission...');

      // Validation
      if (!category || !title) {
        setError('Please select a category and enter a title');
        setSubmitting(false);
        return;
      }

      // Require files for final submission (unless updating existing submission with files)
      if (!isUpdating && keyPhoto.length === 0) {
        setError('Key photograph is required');
        setSubmitting(false);
        return;
      }
      if (!isUpdating && additionalPhotos.length < 2) {
        setError('At least 2 additional photographs are required');
        setSubmitting(false);
        return;
      }

      // Build FormData
      const formData = new FormData();
      formData.append('registrationId', selectedRegistration!);
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('isDraft', 'false'); // Always submit as final

      if (keyPhoto[0]) formData.append('keyPhotograph', keyPhoto[0]);
      additionalPhotos.forEach((photo) => {
        formData.append('additionalPhotographs', photo);
      });
      if (documentFile[0]) formData.append('documentFile', documentFile[0]);
      if (videoFile[0]) formData.append('videoFile', videoFile[0]);

      // Submit
      console.log('📤 Sending submission request...');
      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (!response.ok) {
        console.error('❌ Submission failed:', data.error);
        setError(data.error || 'Failed to create submission');
        setSubmitting(false);
        return;
      }

      // Success - refresh and close form
      console.log('✅ Submission successful, refreshing registrations...');
      await fetchRegistrations();
      setShowForm(false);
      setSelectedRegistration(null);
      setEditingSubmission(null);
      
      // Show success toast
      toast.success(isUpdating ? 'Submission updated successfully!' : 'Submission created successfully!', {
        description: data.message || 'Your submission has been received.',
        duration: 5000,
      });
    } catch (error) {
      setError('An error occurred while submitting');
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawSubmission = async (submissionId: string, submissionNumber: string) => {
    if (!confirm(`Are you sure you want to withdraw submission ${submissionNumber}? This action cannot be undone.`)) {
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/submissions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission withdrawn successfully');
        await fetchRegistrations(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to withdraw submission');
      }
    } catch (error) {
      console.error('Error withdrawing submission:', error);
      toast.error('An error occurred while withdrawing');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="mt-2 text-gray-600">
            View your competition registrations and create submissions
          </p>
        </div>

        {/* Eligibility Message */}
        {eligibilityMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{eligibilityMessage}</p>
          </div>
        )}

        {/* No Registrations */}
        {registrations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No confirmed registrations
            </h3>
            <p className="mt-2 text-gray-600">
              Register for a competition first to create submissions
            </p>
            <button
              onClick={() => router.push('/competitions')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Competitions
            </button>
          </div>
        )}

        {/* Registrations List */}
        {registrations.length > 0 && !showForm && (
          <div className="space-y-6">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {registration.competition.title}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {registration.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Registration Number:</span>{' '}
                        {registration.registrationNumber}
                      </p>
                      <p>
                        <span className="font-medium">Registered:</span>{' '}
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </p>
                      {registration.competition.submissionDeadline && (
                        <p>
                          <span className="font-medium">Submission Deadline:</span>{' '}
                          {new Date(
                            registration.competition.submissionDeadline
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Submission Status */}
                    {registration.submission ? (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">
                              Submission: {registration.submission.submissionNumber}
                            </p>
                            <p className="text-sm text-blue-700">
                              {registration.submission.title} (
                              {registration.submission.submissionCategory})
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            registration.submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                            registration.submission.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                            registration.submission.status === 'PUBLISHED' ? 'bg-purple-100 text-purple-800' :
                            registration.submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            registration.submission.status === 'WITHDRAWN' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {registration.submission.status}
                          </span>
                        </div>
                        
                        {/* Withdraw button for SUBMITTED, VALIDATED, or PUBLISHED submissions */}
                        {['SUBMITTED', 'VALIDATED', 'PUBLISHED'].includes(registration.submission.status) && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <button
                              onClick={() => handleWithdrawSubmission(registration.submission!.id, registration.submission!.submissionNumber)}
                              disabled={withdrawing}
                              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {withdrawing ? 'Withdrawing...' : 'Withdraw Submission'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <button
                          onClick={() => handleStartSubmission(registration.id)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Add Submission
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submission Form */}
        {showForm && selectedRegistration && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Submission
                </h2>
              </div>
              <button
                onClick={handleCancelSubmission}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Category Selection */}
              <CategorySelector
                value={category as SubmissionCategory | null}
                onChange={(val) => setCategory(val || '')}
              />

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a descriptive title for your submission"
                  required
                />
              </div>

              {/* Description */}
              <DescriptionCounter
                value={description}
                onChange={setDescription}
                minWords={50}
                maxWords={200}
                required
              />

              {/* Key Photograph */}
              <FileUploadZone
                label="Key Photograph"
                description="Upload your main submission photograph (JPG only)"
                accept="image/jpeg,image/jpg"
                maxSize={5 * 1024 * 1024}
                files={keyPhoto}
                onFilesChange={setKeyPhoto}
                required
              />

              {/* Additional Photographs */}
              <FileUploadZone
                label="Additional Photographs"
                description="Upload 2-4 supporting photographs (JPG only)"
                accept="image/jpeg,image/jpg"
                multiple
                maxFiles={4}
                maxSize={5 * 1024 * 1024}
                files={additionalPhotos}
                onFilesChange={setAdditionalPhotos}
                required
              />

              {/* Optional Document */}
              <FileUploadZone
                label="Supporting Document (Optional)"
                description="Upload a PDF document if needed"
                accept="application/pdf"
                maxSize={5 * 1024 * 1024}
                files={documentFile}
                onFilesChange={setDocumentFile}
              />

              {/* Optional Video */}
              <FileUploadZone
                label="Video Presentation (Optional)"
                description="Upload a video file if needed (MP4 only)"
                accept="video/mp4"
                maxSize={10 * 1024 * 1024}
                files={videoFile}
                onFilesChange={setVideoFile}
              />

              {/* Action Buttons */}
              <div className="flex pt-6 border-t">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Entry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
