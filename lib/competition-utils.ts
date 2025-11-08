/**
 * Competition Registration Utilities
 * Helper functions for competition registration system
 */

import { RegistrationType } from '@prisma/client';
import { REGISTRATION_TYPE_CODES, RegistrationNumberComponents } from '@/types/competition';
import crypto from 'crypto';

// ============================================
// REGISTRATION NUMBER GENERATION
// ============================================

/**
 * Generate a unique registration number
 * Format: AC{YEAR}-{TYPE}-{SEQUENCE}
 * Example: AC2025-IND-00001
 */
export function generateRegistrationNumber(
  type: RegistrationType,
  sequence: number,
  year?: number
): string {
  const currentYear = year || new Date().getFullYear();
  const competitionCode = `AC${currentYear}`; // Archalley Competition + Year
  const typeCode = REGISTRATION_TYPE_CODES[type];
  const paddedSequence = sequence.toString().padStart(5, '0');
  
  return `${competitionCode}-${typeCode}-${paddedSequence}`;
}

/**
 * Parse registration number into components
 */
export function parseRegistrationNumber(
  registrationNumber: string
): RegistrationNumberComponents | null {
  const pattern = /^AC(\d{4})-([A-Z]+)-(\d{5})$/;
  const match = registrationNumber.match(pattern);
  
  if (!match) {
    return null;
  }
  
  return {
    year: parseInt(match[1], 10),
    typeCode: match[2],
    sequence: parseInt(match[3], 10),
  };
}

/**
 * Get next sequence number for registration type
 */
export async function getNextSequenceNumber(
  prisma: any,
  competitionId: string,
  type: RegistrationType
): Promise<number> {
  const count = await prisma.competitionRegistration.count({
    where: {
      competitionId,
      participantType: type,
    },
  });
  
  return count + 1;
}

// ============================================
// ORDER ID GENERATION
// ============================================

/**
 * Generate a unique order ID for payments
 * Format: ORDER-AC{YEAR}-{SEQUENCE}
 * Example: ORDER-AC2025-00123
 */
export function generateOrderId(sequence: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(5, '0');
  return `ORDER-AC${currentYear}-${paddedSequence}`;
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
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  
  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
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
export function getPayHereUrl(mode: 'sandbox' | 'live' = 'sandbox'): string {
  return mode === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';
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
  const now = new Date();
  return now >= new Date(startDate) && now <= new Date(deadline);
}

/**
 * Get days remaining until deadline
 */
export function getDaysRemaining(deadline: Date): number {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
