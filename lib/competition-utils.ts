/**
 * Competition Registration Utilities
 * Helper functions for competition registration system
 */

import { RegistrationType } from '@prisma/client';
import { RegistrationNumberComponents } from '@/types/competition';
import crypto from 'crypto';

// ============================================
// REGISTRATION NUMBER GENERATION
// ============================================

/**
 * Generate a unique random registration number
 * Format: Random 6-character alphanumeric string
 * Example: X7K9P2
 * 
 * Uses cryptographically secure random generation.
 * Excludes similar-looking characters (0, O, I, l, 1) for clarity.
 */
export function generateRegistrationNumber(): string {
  // Use clear characters only: 2-9 and A-Z (excluding O and I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters
  const randomBytes = crypto.randomBytes(6);
  
  let registrationNumber = '';
  for (let i = 0; i < 6; i++) {
    registrationNumber += chars[randomBytes[i] % chars.length];
  }
  
  return registrationNumber;
}

/**
 * Generate a unique registration number and verify it doesn't exist in database
 * Retries up to 10 times if collision occurs (extremely unlikely with 6 chars)
 */
export async function generateUniqueRegistrationNumber(
  prisma: any,
  maxRetries: number = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const registrationNumber = generateRegistrationNumber();
    
    // Check if registration number already exists
    const existing = await prisma.competitionRegistration.findFirst({
      where: { registrationNumber },
    });
    
    if (!existing) {
      return registrationNumber;
    }
    
    // If exists, try again (very rare)
    console.log(`Registration number collision detected: ${registrationNumber}, retrying...`);
  }
  
  throw new Error('Failed to generate unique registration number after multiple attempts');
}

/**
 * Parse registration number into components
 * @deprecated No longer needed with random format
 */
export function parseRegistrationNumber(
  _registrationNumber: string
): RegistrationNumberComponents | null {
  // Random format doesn't have structured components
  return null;
}

/**
 * Get next sequence number for registration type
 * @deprecated No longer needed with random format
 */
export async function getNextSequenceNumber(
  _prisma: any,
  _competitionId: string,
  _type: RegistrationType
): Promise<number> {
  // Random format doesn't use sequences
  return 0;
}

// ============================================
// ORDER ID GENERATION
// ============================================

/**
 * Generate a unique order ID for payments
 * Format: ORDER-AC{YEAR}-{SEQUENCE}-{TIMESTAMP}
 * Example: ORDER-AC2025-00123-456789
 * Timestamp added to ensure uniqueness and prevent race conditions
 */
export function generateOrderId(sequence: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(5, '0');
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `ORDER-AC${currentYear}-${paddedSequence}-${timestamp}`;
}

/**
 * Get next order sequence number
 */
export async function getNextOrderSequence(prisma: any): Promise<number> {
  const currentYear = new Date().getFullYear();
  const orderIdPrefix = `ORDER-AC${currentYear}`;
  
  const count = await prisma.competitionPayment.count({
    where: {
      orderId: {
        startsWith: orderIdPrefix,
      },
    },
  });
  
  return count + 1;
}

// ============================================
// ANONYMOUS DISPLAY CODE GENERATION
// ============================================

/**
 * Generate a unique anonymous display code for public entry display
 * Format: ARC{YEAR}-{RANDOM_6_CHARS}
 * Example: ARC2025-X7K9M2
 * 
 * This code is used to display participant entries publicly without revealing their identity.
 * Uses cryptographically secure random generation to prevent reverse engineering.
 */
export function generateDisplayCode(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const prefix = `ARC${currentYear}`;
  
  // Generate 6 random alphanumeric characters (excluding similar-looking chars: 0, O, I, l, 1)
  const chars = '2345679ABCDEFGHJKLMNPQRSTUVWXYZ'; // 30 characters
  const randomBytes = crypto.randomBytes(6);
  
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars[randomBytes[i] % chars.length];
  }
  
  return `${prefix}-${randomCode}`;
}

/**
 * Generate a unique display code and verify it doesn't exist in database
 * Retries up to 10 times if collision occurs
 */
export async function generateUniqueDisplayCode(
  prisma: any,
  year?: number,
  maxRetries: number = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const displayCode = generateDisplayCode(year);
    
    // Check if code already exists
    const existing = await prisma.competitionRegistration.findUnique({
      where: { displayCode },
    });
    
    if (!existing) {
      return displayCode;
    }
    
    // If exists, try again
    console.log(`Display code collision detected: ${displayCode}, retrying...`);
  }
  
  throw new Error('Failed to generate unique display code after multiple attempts');
}

// ============================================
// PAYHERE UTILITIES
// ============================================

/**
 * Generate MD5 hash for PayHere
 * Format: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
 */
export function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string
): string {
  console.log('🔐 Generating PayHere hash with inputs:', {
    merchantId,
    orderId,
    amount,
    currency,
    merchantSecretLength: merchantSecret?.length,
    merchantSecretPreview: merchantSecret?.substring(0, 10) + '...'
  });

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  console.log('🔑 Hashed secret (MD5):', hashedSecret);
  
  const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  console.log('📝 Hash string to be MD5\'d:', hashString);
  
  const finalHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
  
  console.log('✅ Final hash generated:', finalHash);
  
  return finalHash;
}

/**
 * Verify PayHere response signature
 */
export function verifyPayHereSignature(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string
): boolean {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  const hashString = `${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`;
  
  const calculatedHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
  
  return calculatedHash === md5sig;
}

/**
 * Get PayHere payment URL based on mode
 */
export function getPayHereUrl(): string {
  return 'https://www.payhere.lk/pay/checkout';
}

// ============================================
// CART UTILITIES
// ============================================

/**
 * Calculate cart expiry time
 * Returns far future date if expiry is disabled via CART_EXPIRY_DISABLED env variable
 */
export function calculateCartExpiry(): Date {
  // Check if expiry is disabled via environment variable
  const expiryDisabled = process.env.CART_EXPIRY_DISABLED === 'true';
  
  if (expiryDisabled) {
    // Return a date far in the future (10 years from now) when expiry is disabled
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    return farFuture;
  }
  
  // Normal expiry (30 minutes)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return now;
}

/**
 * Check if cart is expired
 * Returns false if expiry is disabled via CART_EXPIRY_DISABLED env variable
 */
export function isCartExpired(expiresAt: Date): boolean {
  // If expiry is disabled, never expire
  if (process.env.CART_EXPIRY_DISABLED === 'true') {
    return false;
  }
  
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate early bird discount
 */
export function calculateEarlyBirdDiscount(
  amount: number,
  discountPercentage: number,
  deadline: Date
): number {
  if (new Date() > deadline) {
    return 0;
  }
  
  return Math.round((amount * discountPercentage) / 100);
}

/**
 * Calculate cart total with discounts
 */
export function calculateCartTotal(
  subtotal: number,
  discount: number = 0
): number {
  return Math.max(0, subtotal - discount);
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (International format with country code required)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // REQUIRE international format with + prefix and country code
  // Format: +[1-3 digits country code][9-14 digits phone number]
  // Examples: +94771234567, +1 234 567 8900, +44 20 1234 5678
  const phoneRegex = /^\+\d{1,3}\d{9,14}$/;
  
  return phoneRegex.test(cleaned);
}

/**
 * Validate member data
 */
export function validateMemberInfo(
  member: any,
  isStudent: boolean = false,
  isKids: boolean = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!member.name || member.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  // For kids, validate parent email; for students, validate studentEmail; for others, validate email
  if (isKids) {
    if (!member.parentEmail || !isValidEmail(member.parentEmail)) {
      errors.push("Valid parent/guardian email is required");
    }
    if (!member.parentPhone || member.parentPhone.trim().length === 0) {
      errors.push("Parent/guardian phone number is required");
    } else if (!isValidPhone(member.parentPhone)) {
      errors.push('Invalid phone number format (use format: +94771234567 or 0771234567)');
    }
    if (!member.parentFirstName || member.parentFirstName.trim().length === 0) {
      errors.push("Parent/guardian first name is required");
    }
    if (!member.parentLastName || member.parentLastName.trim().length === 0) {
      errors.push("Parent/guardian last name is required");
    }
    if (!member.dateOfBirth || member.dateOfBirth.trim().length === 0) {
      errors.push("Child's date of birth is required");
    }
    if (!member.postalAddress || member.postalAddress.trim().length === 0) {
      errors.push('Postal address is required for kids registrations');
    }
  } else if (isStudent) {
    if (!member.studentEmail || !isValidEmail(member.studentEmail)) {
      errors.push('Valid student email is required');
    }
    if (!member.phone || member.phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!isValidPhone(member.phone)) {
      errors.push('Invalid phone number format (use format: +94771234567 or 0771234567)');
    }
    if (!member.institution || member.institution.trim().length === 0) {
      errors.push('Institution name is required for student registrations');
    }
    if (!member.courseOfStudy || member.courseOfStudy.trim().length === 0) {
      errors.push('Course of study is required for student registrations');
    }
    if (!member.dateOfBirth || member.dateOfBirth.trim().length === 0) {
      errors.push('Date of birth is required for student registrations');
    }
    if (!member.idCardUrl || member.idCardUrl.trim().length === 0) {
      errors.push('Student ID card upload is required for student registrations');
    }
  } else {
    // For individual, team, and company registrations
    if (!member.email || !isValidEmail(member.email)) {
      errors.push('Valid email is required');
    }
    if (!member.phone || member.phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!isValidPhone(member.phone)) {
      errors.push('Invalid phone number format (use format: +94771234567 or 0771234567)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get current date in Sri Lanka timezone (Asia/Colombo)
 * Returns a Date object representing the current date/time in Sri Lanka timezone
 */
export function getCurrentDateInSriLanka(): Date {
  // Get current time
  const now = new Date();
  
  // Get date components in Sri Lanka timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
  
  // Create a Date object in UTC that represents the Sri Lanka time
  // We need to create it as if it were in UTC, then adjust for the timezone offset
  // Sri Lanka is UTC+5:30, so we subtract 5:30 hours to get the UTC equivalent
  const sriLankaDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  // Adjust for timezone offset (subtract 5:30 hours to get UTC equivalent)
  sriLankaDate.setUTCHours(sriLankaDate.getUTCHours() - 5);
  sriLankaDate.setUTCMinutes(sriLankaDate.getUTCMinutes() - 30);
  
  return sriLankaDate;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(
  startDate: Date,
  deadline: Date
): boolean {
  const now = getCurrentDateInSriLanka();
  return now >= new Date(startDate) && now <= new Date(deadline);
}

/**
 * Get days remaining until deadline
 */
export function getDaysRemaining(deadline: Date): number {
  const now = getCurrentDateInSriLanka();
  const diff = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Registration period types
 * Note: KIDS is NOT a period - it's a registration type that's available Nov 21-Dec 21
 * During that time, kids use their own pricing, but other types use STANDARD/LATE pricing
 */
export type RegistrationPeriod = 'EARLY_BIRD' | 'STANDARD' | 'LATE';

/**
 * Get date components in Sri Lanka timezone (Asia/Colombo)
 * Returns year, month, day as they appear in Sri Lanka timezone
 */
function getDateComponentsInSriLanka(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  
  return { year, month, day };
}

/**
 * Compare two dates by their date components in Sri Lanka timezone
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDatesInSriLanka(date1: Date, date2: Date): number {
  const d1 = getDateComponentsInSriLanka(date1);
  const d2 = getDateComponentsInSriLanka(date2);
  
  if (d1.year !== d2.year) return d1.year < d2.year ? -1 : 1;
  if (d1.month !== d2.month) return d1.month < d2.month ? -1 : 1;
  if (d1.day !== d2.day) return d1.day < d2.day ? -1 : 1;
  return 0;
}

/**
 * Determine the current registration period based on dates
 * Returns the period that applies to the current date in Sri Lanka timezone
 * 
 * Period Priority (checked in this order):
 * 1. Early Bird: Nov 11-20
 * 2. Late: Dec 21-24
 * 3. Standard: Nov 21-Dec 20
 * 4. Default: STANDARD (fallback)
 * 
 * Note: Kids category (Nov 21-Dec 21) is a separate registration type, not a period.
 * Kids pricing is always 2000 regardless of period.
 */
export function getRegistrationPeriod(
  earlyBirdStart: Date,
  earlyBirdEnd: Date,
  standardStart: Date,
  standardEnd: Date,
  lateStart: Date,
  lateEnd: Date,
  _kidsStart: Date, // Kept for backward compatibility but not used
  _kidsEnd: Date    // Kept for backward compatibility but not used
): RegistrationPeriod {
  const now = getCurrentDateInSriLanka();
  
  // Check if we're in early bird period (Nov 11-20)
  if (compareDatesInSriLanka(now, earlyBirdStart) >= 0 && compareDatesInSriLanka(now, earlyBirdEnd) <= 0) {
    return 'EARLY_BIRD';
  }
  
  // Check if we're in late period (Dec 21-24)
  if (compareDatesInSriLanka(now, lateStart) >= 0 && compareDatesInSriLanka(now, lateEnd) <= 0) {
    return 'LATE';
  }
  
  // Check if we're in standard period (Nov 21-Dec 20)
  if (compareDatesInSriLanka(now, standardStart) >= 0 && compareDatesInSriLanka(now, standardEnd) <= 0) {
    return 'STANDARD';
  }
  
  // Default to standard if none match
  return 'STANDARD';
}

/**
 * Calculate registration price based on registration type and period
 * Pricing structure:
 * - Early Bird (Nov 11-20): Single Entry 2,000, Group Entry 4,000
 * - Standard (Nov 21-Dec 20): Student Entry 2,000, Single Entry 3,000, Group Entry 5,000
 * - Late (Dec 21-24): Student Entry 2,000, Single Entry 5,000, Group Entry 8,000
 * - Kids' Tree Category (Nov 11-Dec 21): Single Entry 2,000 (always)
 */
export function calculateRegistrationPrice(
  registrationType: 'INDIVIDUAL' | 'TEAM' | 'COMPANY' | 'STUDENT' | 'KIDS',
  period: RegistrationPeriod
): number {
  // Kids' Tree Category always costs 2,000 regardless of period
  if (registrationType === 'KIDS') {
    return 2000;
  }
  
  // Student Entry always costs 2,000 (available in Standard and Late periods)
  if (registrationType === 'STUDENT') {
    return 2000;
  }
  
  // Single Entry (INDIVIDUAL)
  if (registrationType === 'INDIVIDUAL') {
    switch (period) {
      case 'EARLY_BIRD':
        return 2000;
      case 'STANDARD':
        return 3000;
      case 'LATE':
        return 5000;
      default:
        return 3000; // Default to standard pricing
    }
  }
  
  // Group Entry (TEAM or COMPANY)
  if (registrationType === 'TEAM' || registrationType === 'COMPANY') {
    switch (period) {
      case 'EARLY_BIRD':
        return 4000;
      case 'STANDARD':
        return 5000;
      case 'LATE':
        return 8000;
      default:
        return 5000; // Default to standard pricing
    }
  }
  
  // Default fallback
  return 3000;
}

// ============================================
// CURRENCY UTILITIES
// ============================================

/**
 * Format currency (LKR)
 */
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency without decimals
 */
export function formatCurrencySimple(amount: number, currency: string = 'LKR'): string {
  return `${amount.toLocaleString('en-US')} ${currency}`;
}

// ============================================
// REGISTRATION STATUS UTILITIES
// ============================================

/**
 * Update registration status with automatic timestamp updates
 */
export async function updateRegistrationStatus(
  prisma: any,
  registrationId: string,
  status: 'PENDING' | 'CONFIRMED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED',
  additionalData?: Record<string, any>
) {
  const updateData: any = {
    status,
    updatedAt: new Date(),
    ...additionalData,
  };

  // Automatically set timestamps based on status
  if (status === 'CONFIRMED' && !additionalData?.confirmedAt) {
    updateData.confirmedAt = new Date();
  }

  if (status === 'SUBMITTED' && !additionalData?.submittedAt) {
    updateData.submittedAt = new Date();
    updateData.submissionStatus = 'SUBMITTED';
  }

  return await prisma.competitionRegistration.update({
    where: { id: registrationId },
    data: updateData,
  });
}

/**
 * Update submission status with automatic timestamp
 */
export async function updateSubmissionStatus(
  prisma: any,
  registrationId: string,
  submissionStatus: 'NOT_SUBMITTED' | 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'RESUBMITTED' | 'ACCEPTED' | 'REJECTED',
  additionalData?: Record<string, any>
) {
  const updateData: any = {
    submissionStatus,
    updatedAt: new Date(),
    ...additionalData,
  };

  // Set submittedAt when status changes to SUBMITTED or RESUBMITTED
  if (['SUBMITTED', 'RESUBMITTED'].includes(submissionStatus) && !additionalData?.submittedAt) {
    updateData.submittedAt = new Date();
    // Also update main status to SUBMITTED if it's CONFIRMED
    const registration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
      select: { status: true },
    });
    if (registration?.status === 'CONFIRMED') {
      updateData.status = 'SUBMITTED';
    }
  }

  return await prisma.competitionRegistration.update({
    where: { id: registrationId },
    data: updateData,
  });
}
