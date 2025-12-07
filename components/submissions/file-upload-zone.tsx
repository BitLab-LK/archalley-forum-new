/**
 * File Upload Zone Component
 * Drag-and-drop file upload with validation
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { formatFileSize } from '@/lib/azure-blob-submission-upload';

interface FilePreviewItemProps {
  file: File;
  index: number;
  isImage: boolean;
  disabled: boolean;
  onRemove: () => void;
}

function FilePreviewItem({ file, index, isImage, disabled, onRemove }: FilePreviewItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Create object URL for images
  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isImage]);

  if (isImage && previewUrl && !imageError) {
    return (
      <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div className="relative bg-gray-100" style={{ height: '120px' }}>
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {/* Remove Button Overlay */}
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Remove file"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-1.5">
          <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    );
  }

  // Fallback for non-images or failed image loads
  return (
    <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div className="p-2">
        <div className="flex items-center gap-2">
          {/* File Icon */}
          <div className="flex-shrink-0">
            {file.type === 'application/pdf' ? (
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Remove Button */}
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="flex-shrink-0 text-red-500 hover:text-red-700"
              title="Remove file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FileUploadZoneProps {
  label: string;
  description?: string;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  required?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
  existingFileUrl?: string | null; // For single file uploads (e.g., key photo, document, video)
  existingFileUrls?: string[]; // For multiple file uploads (e.g., additional photos)
  onRemoveExistingUrl?: (url: string, index?: number) => void; // Callback to remove existing URL
}

export function FileUploadZone({
  label,
  description,
  accept,
  multiple = false,
  maxFiles = 1,
  maxSize,
  required = false,
  files,
  onFilesChange,
  error,
  disabled = false,
  existingFileUrl,
  existingFileUrls = [],
  onRemoveExistingUrl,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Determine if we have existing files to show
  const hasExistingFiles = existingFileUrl || existingFileUrls.length > 0;
  const existingFilesArray = existingFileUrl ? [existingFileUrl] : existingFileUrls;

  // Debug logging
  if (hasExistingFiles) {
    console.log(`🎨 FileUploadZone "${label}" - Existing files:`, {
      existingFileUrl,
      existingFileUrls,
      filesLength: files.length,
      hasExistingFiles,
      willShow: hasExistingFiles && files.length === 0,
    });
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (multiple) {
        // Calculate available slots considering existing files
        const existingCount = existingFileUrls?.length || 0;
        const availableSlots = maxFiles - existingCount;
        const filesToAdd = Math.min(droppedFiles.length, availableSlots);
        const newFiles = [...files, ...droppedFiles.slice(0, filesToAdd)];
        onFilesChange(newFiles);
      } else {
        const newFiles = droppedFiles.slice(0, 1);
        onFilesChange(newFiles);
      }
    },
    [disabled, files, multiple, maxFiles, onFilesChange, existingFileUrls]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (multiple) {
        // Calculate available slots considering existing files
        const existingCount = existingFileUrls?.length || 0;
        const availableSlots = maxFiles - existingCount;
        const filesToAdd = Math.min(selectedFiles.length, availableSlots);
        const newFiles = [...files, ...selectedFiles.slice(0, filesToAdd)];
        onFilesChange(newFiles);
      } else {
        const newFiles = selectedFiles.slice(0, 1);
        onFilesChange(newFiles);
      }
      
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [files, multiple, maxFiles, onFilesChange, existingFileUrls]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {maxFiles > 1 && (
          <span className="text-sm text-gray-500">
            {(existingFileUrls?.length || 0) + files.length}/{maxFiles} files
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or
            drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept.includes('image') && 'JPG files only'}
            {accept.includes('pdf') && 'PDF files only'}
            {accept.includes('video') && 'MP4 files only'}
            {maxSize && ` (max ${formatFileSize(maxSize)})`}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Existing Files (from database) */}
      {hasExistingFiles && files.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Currently Uploaded:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingFilesArray.map((url, index) => {
              const fileName = url.split('/').pop() || 'File';
              const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              const isPDF = url.match(/\.pdf$/i);
              const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
              
              return (
                <div
                  key={index}
                  className="relative group border border-blue-200 rounded-lg overflow-hidden bg-blue-50"
                >
                  {isImage ? (
                    <>
                      <div className="relative bg-gray-100" style={{ height: '120px' }}>
                        <img
                          src={url}
                          alt={fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                        {/* Action Buttons Overlay */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                            title="View full size"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          {onRemoveExistingUrl && !disabled && (
                            <button
                              type="button"
                              onClick={() => onRemoveExistingUrl(url, index)}
                              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              title="Remove file"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-1.5">
                        <p className="text-xs font-medium text-gray-900 truncate" title={fileName}>
                          {fileName}
                        </p>
                        <p className="text-xs text-blue-600">
                          ✓ Uploaded
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {isPDF ? (
                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          ) : isVideo ? (
                            <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                            {fileName}
                          </p>
                          <p className="text-xs text-blue-600">
                            ✓ Uploaded
                          </p>
                        </div>

                        {/* View Button */}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                          title="View file"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 italic">
            Upload new file(s) above to add to existing ones. Delete unwanted files using the remove button.
          </p>
        </div>
      )}

      {/* File Preview (newly uploaded files) */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {hasExistingFiles ? 'New files to upload (will be added to existing):' : 'Selected files:'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              
              return (
                <FilePreviewItem
                  key={`${file.name}-${index}`}
                  file={file}
                  index={index}
                  isImage={isImage}
                  disabled={disabled}
                  onRemove={() => removeFile(index)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
