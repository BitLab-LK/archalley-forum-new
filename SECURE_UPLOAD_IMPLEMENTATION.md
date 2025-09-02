# Secure Image Upload File Naming System

## Overview
Updated the image upload system to use secure, anonymous file names that are both secure and user-friendly. The system generates short, clean filenames for storage while providing intuitive display names for user downloads.

## Changes Made

### 1. Updated `lib/utils.ts`
- Added `generateSecureImageFilename()` function that creates short, secure filenames (e.g., `img_abc12345.webp`)
- Added `generateDisplayFilename()` function for user-friendly download names (e.g., `photo.jpg`, `image.webp`)
- Added `getExtensionFromMimeType()` function for proper file extension handling
- Moved `sanitizeFilename()` function from upload routes to utils for reusability

### 2. Updated `app/api/upload/blob/route.ts` (Main Image Upload)
- Uses short secure filenames: `img_abc12345.webp` (only 8 random characters)
- Returns user-friendly display names: `photo.jpg`, `image.webp`, `photo_2.jpg` for multiple files
- Maintains all existing image processing and compression logic

### 3. Updated `app/api/upload/registration/route.ts` (Profile Pictures)
- Uses format: `profile_abc12345.jpg` for profile picture uploads
- Returns display name: `profile.jpg` for user downloads

## Security Benefits

1. **Privacy Protection**: No trace of user's original file names in stored files
2. **Security Enhancement**: Prevents potential filename-based attacks
3. **Anonymous Storage**: Uploaded files cannot be traced back to original names
4. **User-Friendly**: Clean, short filenames that are easy to understand

## File Naming Examples

### Storage Names (What gets saved to Vercel Blob):
- Single image: `img_abc12345.webp` (12 characters + extension)
- Profile picture: `profile_def67890.jpg`
- JPEG fallback: `img_ghi11111.jpg`

### Display Names (What users see when downloading):
- Single image: `image.webp`
- Photo: `photo.jpg`
- Multiple images: `photo_1.jpg`, `photo_2.webp`, `photo_3.jpg`
- Profile picture: `profile.jpg`
- Animation: `animation.gif`

### Before vs After Comparison:

**Before (Old System):**
- User uploads: `my_secret_document.jpg`
- Stored as: `1693737600000-my_secret_document.jpg` (very long)
- User downloads: `my_secret_document.jpg` (exposes original name)

**After (New System):**
- User uploads: `my_secret_document.jpg`
- Stored as: `img_a1b2c3d4.webp` (short and secure)
- User downloads: `photo.webp` (clean and anonymous)

## Technical Details

- Uses Node.js `crypto.randomUUID()` for secure unique identifiers (first 8 characters)
- Maintains file type optimization (WebP/JPEG compression)
- Preserves all existing upload validation and processing
- Compatible with Vercel Blob storage system
- Smart display naming based on file type and quantity

## User Experience

- **Right-click Save As**: Users see clean names like `photo.jpg` instead of long random strings
- **Download behavior**: Intuitive file names that make sense to users
- **Multiple uploads**: Automatically numbered (`photo_1.jpg`, `photo_2.webp`, etc.)
- **Privacy maintained**: No trace of original sensitive filenames

## Testing

The system maintains full backward compatibility with existing:
- Upload UI components
- Image display functionality  
- Download capabilities
- Blob storage operations

Users now get both security and usability - files are stored securely but downloaded with friendly names.
