/**
 * Competition Registration Types
 * Type definitions for the competition registration system
 */

import {
  Competition,
  CompetitionRegistrationType,
  RegistrationCart,
  RegistrationCartItem,
  CompetitionRegistration,
  CompetitionPayment,
  RegistrationType,
  CompetitionStatus,
  RegistrationStatus,
  PaymentStatus,
  CartStatus,
} from '@prisma/client';

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type CompetitionWithTypes = Competition & {
  registrationTypes: CompetitionRegistrationType[];
  _count?: {
    registrations: number;
  };
};

export type CartWithItems = RegistrationCart & {
  items: (RegistrationCartItem & {
    competition: Competition;
    registrationType: CompetitionRegistrationType;
  })[];
};

export type RegistrationWithDetails = CompetitionRegistration & {
  competition: Competition;
  registrationType: CompetitionRegistrationType;
  payment?: CompetitionPayment | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type PaymentWithDetails = CompetitionPayment & {
  competition: Competition;
  registrations: CompetitionRegistration[];
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

// ============================================
// FORM DATA TYPES
// ============================================

export interface RegistrationFormData {
  competitionId: string;
  registrationTypeId: string;
  country: string;
  participantType: RegistrationType;
  referralSource?: string;
  members: MemberInfo[];
  agreements: AgreementData;
}

export interface MemberInfo {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string; // For teams: 'Lead', 'Designer', etc.
  studentId?: string; // For students
  institution?: string; // For students
  courseOfStudy?: string; // For students - Course/Degree Program
  dateOfBirth?: string; // For students
  studentEmail?: string; // For students - University/School Email
  idCardFile?: File | string; // For students - Student ID Card / National ID / Passport (local file)
  idCardUrl?: string; // For students - Uploaded file URL from Azure Blob Storage
  // For kids registration
  parentFirstName?: string; // Parent/Guardian's First Name
  parentLastName?: string; // Parent/Guardian's Last Name
  parentEmail?: string; // Parent/Guardian's Email
  parentPhone?: string; // Parent/Guardian's Contact Number
  postalAddress?: string; // Postal Address (for gift delivery)
}

export interface AgreementData {
  agreedToTerms: boolean;
  agreedToWebsiteTerms: boolean;
  agreedToPrivacyPolicy: boolean;
  agreedToRefundPolicy: boolean;
}

// ============================================
// CART TYPES
// ============================================

export interface AddToCartData {
  competitionId: string;
  registrationTypeId: string;
  country: string;
  participantType: RegistrationType;
  referralSource?: string;
  members: MemberInfo[];
  agreements: AgreementData;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  items: CartItemSummary[];
}

export interface CartItemSummary {
  id: string;
  competitionTitle: string;
  registrationType: string;
  country: string;
  memberCount: number;
  unitPrice: number;
  subtotal: number;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PayHerePaymentData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  hash: string; // MD5 hash for security
}

export interface PayHereResponse {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string; // "2" for success
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method: string;
  status_message: string;
  card_holder_name?: string;
  card_no?: string;
  payment_id: string;
}

export interface CheckoutData {
  cartId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country: string;
  };
  paymentMethod?: 'card' | 'bank';
  bankSlipUrl?: string;
  bankSlipFileName?: string;
  willSendViaWhatsApp?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CartResponse {
  cart: CartWithItems;
  summary: CartSummary;
}

export interface RegistrationResponse {
  registration: RegistrationWithDetails;
  registrationNumber: string;
  message: string;
}

export interface PaymentInitiationResponse {
  orderId: string;
  paymentData: PayHerePaymentData;
  paymentUrl: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface RegistrationNumberComponents {
  year: number;
  typeCode: string;
  sequence: number;
}

export const REGISTRATION_TYPE_CODES: Record<RegistrationType, string> = {
  INDIVIDUAL: 'IND',
  TEAM: 'TEAM',
  COMPANY: 'COM',
  STUDENT: 'STU',
  KIDS: 'KIDS',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Payment Pending',
  PROCESSING: 'Processing Payment',
  COMPLETED: 'Payment Completed',
  FAILED: 'Payment Failed',
  CANCELLED: 'Payment Cancelled',
  REFUNDED: 'Payment Refunded',
  PARTIALLY_REFUNDED: 'Partially Refunded',
  EXPIRED: 'Payment Expired',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'Pending Confirmation',
  CONFIRMED: 'Confirmed',
  SUBMITTED: 'Project Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
  UPCOMING: 'Coming Soon',
  REGISTRATION_OPEN: 'Registration Open',
  REGISTRATION_CLOSED: 'Registration Closed',
  IN_PROGRESS: 'In Progress',
  JUDGING: 'Judging Phase',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ============================================
// EXPORT ALL PRISMA ENUMS
// ============================================

export {
  RegistrationType,
  CompetitionStatus,
  RegistrationStatus,
  PaymentStatus,
  CartStatus,
  type Competition,
  type CompetitionRegistrationType,
  type RegistrationCart,
  type RegistrationCartItem,
  type CompetitionRegistration,
  type CompetitionPayment,
};
