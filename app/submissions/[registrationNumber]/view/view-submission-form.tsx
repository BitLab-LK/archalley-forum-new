/**
 * View Submission Component
 * Public read-only view for submitted entries
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

interface Submission {
  id: string;
  status: string;
  title: string;
  submissionCategory: string;
  description: string;
  keyPhotographUrl: string | null;
  additionalPhotographs: string[];
  documentFileUrl: string | null;
  videoFileUrl: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ViewSubmissionFormProps {
  registration: Registration;
  submission: Submission;
}

export function ViewSubmissionForm({ registration, submission }: ViewSubmissionFormProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Collect all images for lightbox
  const allImages: string[] = [];
  if (submission.keyPhotographUrl) {
    allImages.push(submission.keyPhotographUrl);
  }
  allImages.push(...submission.additionalPhotographs);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % allImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, allImages.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-purple-100 text-purple-800';
      case 'VALIDATED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button - Only show if user is logged in */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Go Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Competition Submission</h1>
          <p className="mt-2 text-gray-600">
            {registration.competition.title} - Entry {registration.registrationNumber}
          </p>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
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


          <div className="space-y-8">
            {/* Submission Status */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Submission Status</h3>
                  <p className="text-sm text-gray-600">
                    {submission.submittedAt && `Submitted on ${new Date(submission.submittedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  </p>
                </div>
                <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Category</h3>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                {submission.submissionCategory === 'DIGITAL' ? 'Digital Design' : 'Physical Design'}
              </div>
            </div>

            {/* Concept */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Concept</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {submission.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Key Photograph */}
            {submission.keyPhotographUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Photograph</h3>
                <div 
                  className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(0)}
                >
                  <img
                    src={submission.keyPhotographUrl}
                    alt="Key photograph"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Photographs */}
            {submission.additionalPhotographs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Additional Photographs ({submission.additionalPhotographs.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {submission.additionalPhotographs.map((url, index) => {
                    const lightboxIdx = submission.keyPhotographUrl ? index + 1 : index;
                    return (
                      <div 
                        key={index} 
                        className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openLightbox(lightboxIdx)}
                      >
                        <img
                          src={url}
                          alt={`Additional photograph ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <svg className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Document */}
            {submission.documentFileUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supporting Document</h3>
                <a
                  href={submission.documentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 font-medium">View PDF Document</span>
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Optional Video */}
            {submission.videoFileUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Presentation</h3>
                <a
                  href={submission.videoFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span className="text-purple-700 font-medium">View Video</span>
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Submission Metadata */}
            <div className="pt-6 border-t">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(submission.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(submission.updatedAt).toLocaleString()}
                  </span>
                </div>
                {submission.submittedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* Next Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          {/* Image */}
          <div 
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[lightboxIndex]}
              alt={`Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

