/**
 * Azure Blob Upload Utilities for Submissions
 * Handles file uploads to Azure Blob storage with validation
 */

import { uploadToAzureBlob, deleteFromAzureBlob } from '@/lib/azure-blob-storage';
import type { 
  FileUploadResult, 
  FileValidationResult, 
  UploadConfig,
  SubmissionCategory 
} from '@/types/submission';

// ============================================
// FILE VALIDATION
// ============================================

export function validateFile(
  file: File,
  fileType: 'photo' | 'document' | 'video'
): FileValidationResult {
  
  const validations = {
    photo: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg'],
      label: 'Image (JPG)',
    },
    document: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['application/pdf'],
      label: 'Document (PDF)',
    },
    video: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['video/mp4'],
      label: 'Video (MP4)',
    }
  };
  
  const rules = validations[fileType];
  
  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type for ${rules.label}. Allowed: ${rules.allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  if (file.size > rules.maxSize) {
    const maxSizeMB = (rules.maxSize / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `File too large. Maximum size for ${rules.label}: ${maxSizeMB}MB` 
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }
  
  return { valid: true };
}

export function validateMultiplePhotos(files: File[]): FileValidationResult {
  // Check count
  if (files.length < 2) {
    return {
      valid: false,
      error: 'At least 2 additional photographs are required'
    };
  }
  
  if (files.length > 4) {
    return {
      valid: false,
      error: 'Maximum 4 additional photographs allowed'
    };
  }
  
  // Validate each photo
  for (let i = 0; i < files.length; i++) {
    const validation = validateFile(files[i], 'photo');
    if (!validation.valid) {
      return {
        valid: false,
        error: `Photo ${i + 1}: ${validation.error}`
      };
    }
  }
  
  return { valid: true };
}

// ============================================
// PATH GENERATION
// ============================================

export function generateBlobPath(
  registrationNumber: string,
  category: SubmissionCategory,
  fileType: 'key-photo' | 'photo' | 'document' | 'video',
  index?: number
): string {
  const year = new Date().getFullYear();
  const categoryFolder = category.toLowerCase();
  
  const basePath = `competitions/archalley-${year}/submissions/${categoryFolder}/${registrationNumber}`;
  
  switch (fileType) {
    case 'key-photo':
      return `${basePath}/key-photo.jpg`;
    case 'photo':
      return `${basePath}/photo-${index}.jpg`;
    case 'document':
      return `${basePath}/document.pdf`;
    case 'video':
      return `${basePath}/video.mp4`;
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
}

// ============================================
// FILE UPLOAD
// ============================================

export async function uploadSubmissionFile(
  file: File,
  fileType: 'key-photo' | 'photo' | 'document' | 'video',
  config: UploadConfig,
  index?: number
): Promise<FileUploadResult> {
  
  // Validate file before upload
  const fileTypeMap = {
    'key-photo': 'photo' as const,
    'photo': 'photo' as const,
    'document': 'document' as const,
    'video': 'video' as const,
  };
  
  const validation = validateFile(file, fileTypeMap[fileType]);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Generate path
  const pathname = generateBlobPath(
    config.registrationNumber,
    config.category,
    fileType,
    index
  );
  
  try {
    // Upload to Azure Blob
    const result = await uploadToAzureBlob(file, pathname, {
      containerName: 'submissions',
      contentType: file.type,
    });
    
    return {
      url: result.url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Azure Blob upload error:', error);
    throw new Error(`Failed to upload ${fileType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadMultiplePhotos(
  files: File[],
  config: UploadConfig
): Promise<FileUploadResult[]> {
  
  // Validate all photos first
  const validation = validateMultiplePhotos(files);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Upload all photos
  const uploadPromises = files.map((file, index) =>
    uploadSubmissionFile(file, 'photo', config, index + 1)
  );
  
  return Promise.all(uploadPromises);
}

// ============================================
// FILE DELETION
// ============================================

export async function deleteSubmissionFiles(
  registrationNumber: string,
  category: SubmissionCategory,
  year: number
): Promise<void> {
  const categoryFolder = category.toLowerCase();
  const prefix = `competitions/archalley-${year}/submissions/${categoryFolder}/${registrationNumber}/`;
  
  try {
    // Azure Blob Storage doesn't have a list by prefix in the same way
    // For now, delete individual files when we know their paths
    // You can implement a proper list and delete if needed using Azure SDK
    console.log(`Would delete files with prefix: ${prefix}`);
    // TODO: Implement Azure Blob deletion by prefix if needed
  } catch (error) {
    console.error('Error deleting submission files:', error);
    throw new Error('Failed to delete submission files');
  }
}

export async function deleteSingleFile(url: string): Promise<void> {
  try {
    await deleteFromAzureBlob(url, 'submissions');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.'));
}

export function isValidImageFile(file: File): boolean {
  return file.type === 'image/jpeg' || file.type === 'image/jpg';
}

export function isValidPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}

export function isValidVideoFile(file: File): boolean {
  return file.type === 'video/mp4';
}

// ============================================
// WORD COUNT VALIDATION
// ============================================

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function validateWordCount(
  text: string,
  min: number = 50,
  max: number = 200
): FileValidationResult {
  const wordCount = countWords(text);
  
  if (wordCount < min) {
    return {
      valid: false,
      error: `Description must be at least ${min} words (currently ${wordCount} words)`
    };
  }
  
  if (wordCount > max) {
    return {
      valid: false,
      error: `Description must not exceed ${max} words (currently ${wordCount} words)`
    };
  }
  
  return { valid: true };
}
