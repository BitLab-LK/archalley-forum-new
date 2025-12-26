/**
 * Submission Form Component
 * Reusable form component for creating/editing submissions
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CategorySelector } from '@/components/submissions/category-selector';
import { FileUploadZone } from '@/components/submissions/file-upload-zone';
import { DescriptionCounter } from '@/components/submissions/description-counter';
import type { SubmissionCategory } from '@/types/submission';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface Registration {
  id: string;
  registrationNumber: string;
  competitionId: string;
  status: string;
  createdAt: string;
  competition: {
    id: string;
    title: string;
  };
  registrationType?: {
    id: string;
    name: string;
    type: string;
  } | null;
  submission?: {
    id: string;
    status: string;
    title: string;
    submissionCategory: string;
  } | null;
}

interface EligibilityResponse {
  canSubmit: boolean;
  reason: string;
}

interface SubmissionFormProps {
  registration: Registration;
}

export function SubmissionForm({ registration }: SubmissionFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<SubmissionCategory | ''>('');
  const [description, setDescription] = useState('');
  
  // Store blob URLs instead of File objects
  const [keyPhotoUrl, setKeyPhotoUrl] = useState<string | null>(null);
  const [additionalPhotosUrls, setAdditionalPhotosUrls] = useState<string[]>([]);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null);
  
  // Track selected files (before upload) for additional photos
  const [selectedAdditionalPhotos, setSelectedAdditionalPhotos] = useState<File[]>([]);
  
  // Track uploading state for each file type
  const [uploadingKeyPhoto, setUploadingKeyPhoto] = useState(false);
  const [uploadingAdditionalPhotos, setUploadingAdditionalPhotos] = useState<boolean[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<Registration['submission'] | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    checkEligibility();
    loadDraftIfExists();
  }, []);

  // Auto-save draft when form data changes (only if user has made changes)
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save if still loading draft
    if (isLoadingDraft) return;

    // Don't auto-save if user hasn't made any changes
    if (!hasUserInput) return;

    // Check if there's any meaningful data to save
    const hasData = category || 
                    description.trim().length > 0 || 
                    keyPhotoUrl || 
                    additionalPhotosUrls.length > 0 || 
                    documentFileUrl || 
                    videoFileUrl;

    // Only auto-save if there's actual data
    if (!hasData) return;

    // Set new timer to auto-save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveDraft();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [category, description, keyPhotoUrl, additionalPhotosUrls, documentFileUrl, videoFileUrl, isLoadingDraft, hasUserInput]);

  const checkEligibility = async () => {
    try {
      const response = await fetch(
        `/api/competitions/check-eligibility?registrationId=${registration.id}`
      );
      const data: EligibilityResponse = await response.json();
      
      if (!data.canSubmit) {
        setEligibilityMessage(data.reason);
      } else {
        setEligibilityMessage('');
      }
    } catch (error) {
      setEligibilityMessage('Failed to check eligibility');
    }
  };

  const loadDraftIfExists = async () => {
    try {
      // Always try to load draft, even if no submission exists yet
      const response = await fetch(`/api/submissions/${registration.submission?.id || registration.id}?type=draft`);
      
      if (response.ok) {
        const { submission } = await response.json();
        
        if (submission) {
          setEditingSubmission(submission);
          setCategory(submission.submissionCategory as SubmissionCategory || '');
          setDescription(submission.description || '');
          
          setKeyPhotoUrl(submission.keyPhotographUrl || null);
          setAdditionalPhotosUrls(submission.additionalPhotographs || []);
          setDocumentFileUrl(submission.documentFileUrl || null);
          setVideoFileUrl(submission.videoFileUrl || null);
          
          // If already submitted, set read-only mode
          if (submission.status !== 'DRAFT') {
            setIsReadOnly(true);
          } else {
            // If draft exists, mark that user has input (so auto-save can continue)
            setHasUserInput(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const autoSaveDraft = async () => {
    try {
      const response = await fetch('/api/submissions/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          category: category || null,
          description,
          keyPhotographUrl: keyPhotoUrl,
          additionalPhotographsUrls: additionalPhotosUrls,
          documentFileUrl: documentFileUrl,
          videoFileUrl: videoFileUrl,
        }),
      });

      if (response.ok) {
        const { submission } = await response.json();
        setEditingSubmission(submission);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      // Don't show error toast for auto-save failures
    }
  };

  // Upload file immediately when selected
  const uploadFile = async (
    file: File,
    fileType: 'key-photo' | 'photo' | 'document' | 'video',
    index?: number
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('registrationId', registration.id);
    formData.append('fileType', fileType);
    if (category) formData.append('category', category);
    if (index !== undefined) formData.append('index', index.toString());

    const response = await fetch('/api/submissions/upload-file', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the specific error message from the API
      const errorMessage = data.error || data.details || 'Failed to upload file';
      throw new Error(errorMessage);
    }

    const { url } = data;
    if (!url) {
      throw new Error('No URL returned from upload');
    }
    
    return url;
  };

  // Delete file from blob
  const deleteFile = async (url: string) => {
    try {
      const response = await fetch('/api/submissions/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        console.error('Failed to delete file from blob');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Handle file selection and immediate upload
  const handleFileSelect = async (
    files: File[],
    fileType: 'key-photo' | 'photo' | 'document' | 'video',
    setUploading: (value: boolean) => void,
    setUrl: (url: string | null) => void,
    setUrls?: (urls: string[]) => void,
    existingUrl?: string | null,
    existingUrls?: string[],
    maxFiles?: number
  ) => {
    if (files.length === 0) return;

    try {
      setUploading(true);

      if (fileType === 'photo') {
        // Additional photos - can be single or multiple, check if adding new files would exceed max
        const currentCount = existingUrls?.length || 0;
        const maxAllowed = maxFiles || 4;
        const availableSlots = maxAllowed - currentCount;
        
        if (availableSlots <= 0) {
          toast.error(`Maximum ${maxAllowed} additional photos allowed. Please delete some existing photos first.`, {
            duration: 5000,
          });
          setUploading(false);
          return;
        }
        
        // Only upload up to available slots
        const filesToUpload = files.slice(0, availableSlots);
        if (files.length > availableSlots) {
          toast.warning(
            `Only ${availableSlots} file(s) can be added. ${files.length - availableSlots} file(s) were not uploaded.`,
            { duration: 5000 }
          );
        }
        
        const uploadResults: { url: string; index: number }[] = [];
        const errors: { fileName: string; error: string; index: number }[] = [];
        
        // Upload files one by one, catching errors for each
        for (let i = 0; i < filesToUpload.length; i++) {
          try {
            const url = await uploadFile(filesToUpload[i], 'photo', currentCount + i);
            uploadResults.push({ url, index: i });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
            errors.push({ 
              fileName: filesToUpload[i].name, 
              error: errorMessage,
              index: i 
            });
            // Show error for each failed file
            toast.error(`${filesToUpload[i].name}: ${errorMessage}`, {
              duration: 5000,
            });
          }
        }
        
        // Append new URLs to existing ones
        if (setUrls) {
          if (uploadResults.length > 0) {
            const newUrls = uploadResults.map(r => r.url);
            setUrls([...(existingUrls || []), ...newUrls]);
            
            // Mark that user has made changes and auto-save
            setHasUserInput(true);
            autoSaveDraft();
          }
        }
        
        // Show summary if some files failed
        if (errors.length > 0 && uploadResults.length > 0) {
          toast.warning(
            `${uploadResults.length} file(s) uploaded successfully, ${errors.length} file(s) failed`,
            { duration: 5000 }
          );
        } else if (errors.length === filesToUpload.length) {
          // All files failed - don't show additional error, already shown per file
          // Just show a summary
          toast.error('All files failed to upload. Please check file sizes and types.', {
            duration: 5000,
          });
        } else if (uploadResults.length > 0) {
          // All succeeded
          toast.success(`${uploadResults.length} file(s) uploaded successfully`, {
            duration: 3000,
          });
        }
      } else {
        // Single file - check if one already exists
        if (existingUrl) {
          // For single file types (key-photo, document, video), replace existing
          await deleteFile(existingUrl);
        }
        
        // Upload single file
        const url = await uploadFile(files[0], fileType);
        setUrl(url);
        
        // Mark that user has made changes and auto-save
        setHasUserInput(true);
        autoSaveDraft();
      }
    } catch (error) {
      console.error('File upload error:', error);
      // Error message already shown by uploadFile or in the loop above
      // Don't show duplicate error messages
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal
  const handleFileRemove = async (
    url: string | null,
    urls?: string[],
    index?: number
  ) => {
    if (url) {
      await deleteFile(url);
    }
    if (urls && index !== undefined) {
      const urlToDelete = urls[index];
      if (urlToDelete) {
        await deleteFile(urlToDelete);
      }
    }
    autoSaveDraft();
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      // Check if already submitted
      if (editingSubmission && editingSubmission.status !== 'DRAFT') {
        setError('This submission has already been submitted and cannot be modified.');
        setSubmitting(false);
        return;
      }

      // Validation
      if (!category) {
        setError('Please select a category');
        setSubmitting(false);
        return;
      }

      if (!keyPhotoUrl) {
        setError('Key photograph is required');
        setSubmitting(false);
        return;
      }

      if (additionalPhotosUrls.length < 2) {
        setError('At least 2 additional photographs are required');
        setSubmitting(false);
        return;
      }

      if (!agreedToTerms) {
        setError('You must agree to the submission terms before submitting');
        setSubmitting(false);
        return;
      }

      // Submit using the create endpoint (files are already uploaded)
      const formData = new FormData();
      formData.append('registrationId', registration.id);
      if (category) formData.append('category', category);
      if (description) formData.append('description', description);
      formData.append('isDraft', 'false'); // Always submit as final submission
      
      // Pass blob URLs instead of files
      if (keyPhotoUrl) formData.append('keyPhotographUrl', keyPhotoUrl);
      additionalPhotosUrls.forEach((url) => {
        formData.append('additionalPhotographsUrls', url);
      });
      if (documentFileUrl) formData.append('documentFileUrl', documentFileUrl);
      if (videoFileUrl) formData.append('videoFileUrl', videoFileUrl);

      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to create submission';
        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.details) {
          errorMessage = `${errorMessage}: ${data.details}`;
        } else if (response.status === 400) {
          errorMessage = 'Invalid submission data. Please check all fields and try again.';
        } else if (response.status === 401) {
          errorMessage = 'You are not authorized. Please sign in and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        setError(errorMessage);
        setSubmitting(false);
        return;
      }

      // Success - redirect to view submission page
      toast.success('Submission submitted successfully!', {
        description: data.message || 'Your submission has been received and cannot be modified.',
        duration: 5000,
      });
      
      // Redirect to view submission page after a short delay to show success message
      setTimeout(() => {
        router.push(`/submissions/${registration.registrationNumber}/view`);
      }, 1000);
    } catch (error) {
      console.error('Submission error:', error);
      
      let errorMessage = 'An error occurred while submitting';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/submissions')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to My Submissions</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isReadOnly ? 'View Submission' : editingSubmission ? 'Edit Submission' : 'Create Submission'}
          </h1>
          {isReadOnly && (
            <p className="mt-2 text-gray-600">
              This submission has been submitted and is read-only. You cannot make changes.
            </p>
          )}
        </div>

        {/* Eligibility Message */}
        {eligibilityMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{eligibilityMessage}</p>
          </div>
        )}

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isReadOnly ? 'Submission Details' : editingSubmission ? 'Edit Submission' : 'Create Submission'}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Registration Number</div>
              <div className="text-lg font-mono font-semibold text-gray-900">
                {registration.registrationNumber}
              </div>
              {registration.registrationType && (
                <>
                  <div className="text-sm text-gray-600 mt-1">Registration Type</div>
                  <div className="text-base font-medium text-blue-600">
                    {registration.registrationType.name}
                  </div>
                </>
              )}
            </div>
          </div>

          {error && !isReadOnly && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {isReadOnly && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-blue-800 font-medium">Read-Only Mode</p>
                  <p className="text-blue-700 text-sm mt-1">
                    This submission has already been submitted. You can view all details but cannot make any changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Category Selection */}
            <CategorySelector
              value={category as SubmissionCategory | null}
              onChange={(val) => {
                setCategory(val || '');
                setHasUserInput(true);
              }}
              disabled={isReadOnly || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
            />

            {/* Concept */}
            <DescriptionCounter
              value={description}
              onChange={(val) => {
                setDescription(val);
                setHasUserInput(true);
              }}
              minWords={50}
              maxWords={200}
              required
              disabled={isReadOnly || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
            />

            {/* Key Photograph */}
            <div>
              <FileUploadZone
                label="Key Photograph"
                description="Upload your main submission photograph (JPG only)"
                accept="image/jpeg,image/jpg"
                maxSize={5 * 1024 * 1024}
                files={[]}
                onFilesChange={async (files) => {
                  if (files.length > 0) {
                    await handleFileSelect(
                      files,
                      'key-photo',
                      setUploadingKeyPhoto,
                      setKeyPhotoUrl,
                      undefined,
                      keyPhotoUrl,
                      undefined,
                      undefined
                    );
                  }
                }}
                existingFileUrl={keyPhotoUrl}
                onRemoveExistingUrl={async (url) => {
                  await handleFileRemove(url);
                  setKeyPhotoUrl(null);
                }}
                required
                disabled={isReadOnly || uploadingKeyPhoto || submitting || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
              />
              {uploadingKeyPhoto && (
                <p className="mt-2 text-sm text-blue-600">Uploading...</p>
              )}
            </div>

            {/* Additional Photographs */}
            <div>
              <FileUploadZone
                label="Additional Photographs"
                description="Upload 2-4 supporting photographs (JPG only)"
                accept="image/jpeg,image/jpg"
                multiple
                maxFiles={4}
                maxSize={5 * 1024 * 1024}
                files={selectedAdditionalPhotos}
                onFilesChange={async (files) => {
                  // Update selected files state immediately to show preview
                  setSelectedAdditionalPhotos(files);
                  
                  if (files.length > 0) {
                    // Upload all files that are selected (they're all new, not yet uploaded)
                    // Files that are already uploaded are shown separately in existingFileUrls
                    const newUploadingStates = files.map(() => true);
                    setUploadingAdditionalPhotos(newUploadingStates);
                    try {
                      await handleFileSelect(
                        files,
                        'photo',
                        () => {},
                        () => {},
                        setAdditionalPhotosUrls,
                        null,
                        additionalPhotosUrls,
                        4 // maxFiles for additional photos
                      );
                      // Clear selected files after successful upload
                      // The uploaded files will now appear in existingFileUrls
                      setSelectedAdditionalPhotos([]);
                    } catch (error) {
                      console.error('Error uploading additional photos:', error);
                      // Keep files in state if upload failed so user can retry
                    } finally {
                      setUploadingAdditionalPhotos([]);
                    }
                  } else {
                    // Clear selected files if array is empty
                    setSelectedAdditionalPhotos([]);
                  }
                }}
                existingFileUrls={additionalPhotosUrls}
                onRemoveExistingUrl={async (url, index) => {
                  if (index !== undefined) {
                    await handleFileRemove(url, additionalPhotosUrls, index);
                    setAdditionalPhotosUrls(additionalPhotosUrls.filter((_, i) => i !== index));
                  }
                }}
                required
                disabled={isReadOnly || uploadingAdditionalPhotos.some(u => u) || submitting || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
              />
              {uploadingAdditionalPhotos.some(u => u) && (
                <p className="mt-2 text-sm text-blue-600">Uploading...</p>
              )}
            </div>

            {/* Optional Document */}
            <div>
              <FileUploadZone
                label="Supporting Document (Optional)"
                description="Upload a PDF document if needed"
                accept="application/pdf"
                maxSize={5 * 1024 * 1024}
                files={[]}
                onFilesChange={async (files) => {
                  if (files.length > 0) {
                    await handleFileSelect(
                      files,
                      'document',
                      setUploadingDocument,
                      setDocumentFileUrl,
                      undefined,
                      documentFileUrl,
                      undefined,
                      undefined
                    );
                  }
                }}
                existingFileUrl={documentFileUrl}
                onRemoveExistingUrl={async (url) => {
                  await handleFileRemove(url);
                  setDocumentFileUrl(null);
                }}
                disabled={isReadOnly || uploadingDocument || submitting || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
              />
              {uploadingDocument && (
                <p className="mt-2 text-sm text-blue-600">Uploading...</p>
              )}
            </div>

            {/* Optional Video */}
            <div>
              <FileUploadZone
                label="Video Presentation (Optional)"
                description="Upload a video file if needed (MP4 only)"
                accept="video/mp4"
                maxSize={10 * 1024 * 1024}
                files={[]}
                onFilesChange={async (files) => {
                  if (files.length > 0) {
                    await handleFileSelect(
                      files,
                      'video',
                      setUploadingVideo,
                      setVideoFileUrl,
                      undefined,
                      videoFileUrl,
                      undefined,
                      undefined
                    );
                  }
                }}
                existingFileUrl={videoFileUrl}
                onRemoveExistingUrl={async (url) => {
                  await handleFileRemove(url);
                  setVideoFileUrl(null);
                }}
                disabled={isReadOnly || uploadingVideo || submitting || !!(editingSubmission && editingSubmission.status !== 'DRAFT')}
              />
              {uploadingVideo && (
                <p className="mt-2 text-sm text-blue-600">Uploading...</p>
              )}
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="text-xs text-gray-500 italic">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}

            {/* Submission Terms Checkbox */}
            {!isReadOnly && editingSubmission?.status === 'DRAFT' && (
              <div className="pt-6 border-t">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={submitting || uploadingKeyPhoto || uploadingAdditionalPhotos.some(u => u) || uploadingDocument || uploadingVideo}
                  />
                  <span className="text-sm text-gray-700">
                    I agree that I can only submit once and cannot make changes after submission
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="flex gap-3 pt-6 border-t">
                {editingSubmission?.status === 'DRAFT' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingKeyPhoto || uploadingAdditionalPhotos.some(u => u) || uploadingDocument || uploadingVideo || !agreedToTerms}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Submit Entry'}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingKeyPhoto || uploadingAdditionalPhotos.some(u => u) || uploadingDocument || uploadingVideo || !agreedToTerms}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Submit Entry'}
                  </button>
                )}
              </div>
            )}
            
            {/* Read-only submission info */}
            {isReadOnly && editingSubmission && (
              <div className="pt-6 border-t">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Submission Status:</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      editingSubmission.status === 'PUBLISHED' ? 'bg-purple-100 text-purple-800' :
                      editingSubmission.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                      editingSubmission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {editingSubmission.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    This submission has been submitted and cannot be modified. All information is displayed in read-only mode.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

