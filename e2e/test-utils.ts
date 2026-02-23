/**
 * Test Utilities and Validation Helpers
 * Shared utilities for E2E and API tests
 */

// Regular expressions for data validation
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PH: /^(\+63|0)\d{10}$/,
  PHONE_INTL: /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,
  CURRENCY_PHP: /^₱?\s?[\d,]+(\.\d{2})?$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

// Valid enum values
export const VALID_VALUES = {
  USER_ROLES: ['admin', 'vendor', 'coordinator', 'individual', 'couple'] as const,
  USER_STATUSES: ['active', 'suspended', 'banned', 'pending'] as const,
  VERIFICATION_STATUSES: ['pending', 'approved', 'rejected'] as const,
  VERIFICATION_TYPES: ['vendor', 'coordinator'] as const,
  BOOKING_STATUSES: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'] as const,
  PAYMENT_STATUSES: ['pending', 'paid', 'failed', 'refunded'] as const,
} as const;

// Type guards and validators
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}

export function isValidPhone(phone: string): boolean {
  return VALIDATION_PATTERNS.PHONE_INTL.test(phone) || VALIDATION_PATTERNS.PHONE_PH.test(phone);
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isValidISODate(dateStr: string): boolean {
  return VALIDATION_PATTERNS.DATE_ISO.test(dateStr);
}

export function isPositiveNumber(value: unknown): boolean {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return !isNaN(num) && num >= 0;
}

export function isValidUserRole(role: string): boolean {
  return VALID_VALUES.USER_ROLES.includes(role as typeof VALID_VALUES.USER_ROLES[number]);
}

export function isValidUserStatus(status: string): boolean {
  return VALID_VALUES.USER_STATUSES.includes(status as typeof VALID_VALUES.USER_STATUSES[number]);
}

export function isValidVerificationStatus(status: string): boolean {
  return VALID_VALUES.VERIFICATION_STATUSES.includes(status as typeof VALID_VALUES.VERIFICATION_STATUSES[number]);
}

export function isValidBookingStatus(status: string): boolean {
  return VALID_VALUES.BOOKING_STATUSES.includes(status as typeof VALID_VALUES.BOOKING_STATUSES[number]);
}

// Data integrity checks
export interface DataIntegrityReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateUser(user: Record<string, unknown>): DataIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!user.id || typeof user.id !== 'number') {
    errors.push('Missing or invalid user ID');
  }

  if (!user.email) {
    errors.push('Missing email');
  } else if (!isValidEmail(user.email as string)) {
    errors.push(`Invalid email format: ${user.email}`);
  }

  // Optional but validated if present
  if (user.role && !isValidUserRole(user.role as string)) {
    errors.push(`Invalid role: ${user.role}`);
  }

  if (user.status && !isValidUserStatus(user.status as string)) {
    errors.push(`Invalid status: ${user.status}`);
  }

  if (user.created_at && !isValidDate(user.created_at as string)) {
    errors.push(`Invalid created_at date: ${user.created_at}`);
  }

  // Warnings for potentially missing data
  if (!user.name) {
    warnings.push('User has no name');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateVerification(verification: Record<string, unknown>): DataIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!verification.id || typeof verification.id !== 'number') {
    errors.push('Missing or invalid verification ID');
  }

  if (!verification.user_id || typeof verification.user_id !== 'number') {
    errors.push('Missing or invalid user_id reference');
  }

  if (verification.type && !VALID_VALUES.VERIFICATION_TYPES.includes(verification.type as typeof VALID_VALUES.VERIFICATION_TYPES[number])) {
    errors.push(`Invalid verification type: ${verification.type}`);
  }

  if (verification.status && !isValidVerificationStatus(verification.status as string)) {
    errors.push(`Invalid verification status: ${verification.status}`);
  }

  if (verification.submitted_at && !isValidDate(verification.submitted_at as string)) {
    errors.push(`Invalid submitted_at date: ${verification.submitted_at}`);
  }

  if (!verification.business_name) {
    warnings.push('Verification has no business_name');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateService(service: Record<string, unknown>): DataIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!service.id || typeof service.id !== 'number') {
    errors.push('Missing or invalid service ID');
  }

  if (!service.vendor_id || typeof service.vendor_id !== 'number') {
    errors.push('Missing or invalid vendor_id reference');
  }

  if (!service.name) {
    errors.push('Missing service name');
  }

  if (service.price !== undefined && !isPositiveNumber(service.price)) {
    errors.push(`Invalid price: ${service.price}`);
  }

  if (!service.category_id) {
    warnings.push('Service has no category');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateBooking(booking: Record<string, unknown>): DataIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!booking.id) {
    errors.push('Missing booking ID');
  }

  if (!booking.user_id) {
    errors.push('Missing user_id reference');
  }

  if (!booking.service_id && !booking.vendor_id) {
    errors.push('Missing service_id or vendor_id reference');
  }

  if (booking.status && !isValidBookingStatus(booking.status as string)) {
    errors.push(`Invalid booking status: ${booking.status}`);
  }

  if (booking.event_date && !isValidDate(booking.event_date as string)) {
    errors.push(`Invalid event_date: ${booking.event_date}`);
  }

  if (booking.total_amount !== undefined && !isPositiveNumber(booking.total_amount)) {
    errors.push(`Invalid total_amount: ${booking.total_amount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// API Response validation
export interface ApiResponseValidation {
  isValid: boolean;
  hasSuccess: boolean;
  hasData: boolean;
  hasError: boolean;
  structure: string[];
}

export function validateApiResponse(response: unknown): ApiResponseValidation {
  const result: ApiResponseValidation = {
    isValid: false,
    hasSuccess: false,
    hasData: false,
    hasError: false,
    structure: [],
  };

  if (!response || typeof response !== 'object') {
    return result;
  }

  const obj = response as Record<string, unknown>;
  result.structure = Object.keys(obj);
  result.hasSuccess = 'success' in obj;
  result.hasData = 'data' in obj || 'users' in obj || 'services' in obj || 'verifications' in obj;
  result.hasError = 'error' in obj || 'message' in obj;
  result.isValid = result.hasSuccess || result.hasData;

  return result;
}

// Batch validation
export function validateUserBatch(users: Record<string, unknown>[]): {
  valid: number;
  invalid: number;
  errors: Array<{ index: number; errors: string[] }>;
} {
  let valid = 0;
  let invalid = 0;
  const errors: Array<{ index: number; errors: string[] }> = [];

  users.forEach((user, index) => {
    const result = validateUser(user);
    if (result.isValid) {
      valid++;
    } else {
      invalid++;
      errors.push({ index, errors: result.errors });
    }
  });

  return { valid, invalid, errors };
}

// Data consistency checks
export function checkDuplicates<T>(items: T[], keyFn: (item: T) => string | number): {
  hasDuplicates: boolean;
  duplicateKeys: (string | number)[];
} {
  const seen = new Set<string | number>();
  const duplicates: (string | number)[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateKeys: duplicates,
  };
}

export function checkReferentialIntegrity(
  items: Record<string, unknown>[],
  foreignKey: string,
  validIds: Set<number>
): {
  valid: boolean;
  orphanedRecords: number[];
} {
  const orphaned: number[] = [];

  for (const item of items) {
    const fkValue = item[foreignKey];
    if (typeof fkValue === 'number' && !validIds.has(fkValue)) {
      if (item.id && typeof item.id === 'number') {
        orphaned.push(item.id);
      }
    }
  }

  return {
    valid: orphaned.length === 0,
    orphanedRecords: orphaned,
  };
}

// Numeric data checks
export function checkNumericConsistency(values: number[]): {
  hasNaN: boolean;
  hasNegative: boolean;
  hasInfinity: boolean;
  min: number;
  max: number;
  sum: number;
} {
  let hasNaN = false;
  let hasNegative = false;
  let hasInfinity = false;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const value of values) {
    if (isNaN(value)) {
      hasNaN = true;
    } else if (!isFinite(value)) {
      hasInfinity = true;
    } else {
      if (value < 0) hasNegative = true;
      if (value < min) min = value;
      if (value > max) max = value;
      sum += value;
    }
  }

  return {
    hasNaN,
    hasNegative,
    hasInfinity,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
    sum,
  };
}

// Export for use in tests
export default {
  VALIDATION_PATTERNS,
  VALID_VALUES,
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidISODate,
  isPositiveNumber,
  isValidUserRole,
  isValidUserStatus,
  isValidVerificationStatus,
  isValidBookingStatus,
  validateUser,
  validateVerification,
  validateService,
  validateBooking,
  validateApiResponse,
  validateUserBatch,
  checkDuplicates,
  checkReferentialIntegrity,
  checkNumericConsistency,
};
