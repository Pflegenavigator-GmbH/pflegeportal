/**
 * Validierungsfunktionen fuer Formulare
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validiert ein komplettes Formular
 */
export function validateForm(
  data: Record<string, unknown>,
  rules: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = validateField(field, data[field], rule);
      if (error) {
        errors.push(error);
        break; // Nur erster Fehler pro Feld
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'plz' | 'phone';
  value?: number | string | RegExp;
  message?: string;
}

function validateField(
  field: string,
  value: unknown,
  rule: ValidationRule
): ValidationError | null {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);

  switch (rule.type) {
    case 'required':
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return {
          field,
          message: rule.message || `${fieldName} ist erforderlich`
        };
      }
      break;

    case 'email':
      if (value && typeof value === 'string' && !isValidEmail(value)) {
        return {
          field,
          message: rule.message || 'Ungueltige E-Mail-Adresse'
        };
      }
      break;

    case 'min':
      if (typeof value === 'string' && value.length < (rule.value as number)) {
        return {
          field,
          message: rule.message || `${fieldName} muss mindestens ${rule.value} Zeichen haben`
        };
      }
      if (typeof value === 'number' && value < (rule.value as number)) {
        return {
          field,
          message: rule.message || `${fieldName} muss mindestens ${rule.value} sein`
        };
      }
      break;

    case 'max':
      if (typeof value === 'string' && value.length > (rule.value as number)) {
        return {
          field,
          message: rule.message || `${fieldName} darf hoechstens ${rule.value} Zeichen haben`
        };
      }
      if (typeof value === 'number' && value > (rule.value as number)) {
        return {
          field,
          message: rule.message || `${fieldName} darf hoechstens ${rule.value} sein`
        };
      }
      break;

    case 'pattern':
      if (value && typeof value === 'string' && !(rule.value as RegExp).test(value)) {
        return {
          field,
          message: rule.message || `${fieldName} hat ein ungueltiges Format`
        };
      }
      break;

    case 'plz':
      if (value && typeof value === 'string' && !/^\d{5}$/.test(value)) {
        return {
          field,
          message: rule.message || 'Ungueltige Postleitzahl (5 Ziffern)'
        };
      }
      break;

    case 'phone':
      if (value && typeof value === 'string' && !isValidPhone(value)) {
        return {
          field,
          message: rule.message || 'Ungueltige Telefonnummer'
        };
      }
      break;
  }

  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Erlaubt: +49 123 4567890, 0123-4567890, etc.
  return /^[\d\+\-\(\)\s]{6,20}$/.test(phone);
}

/**
 * Validierungsregeln fuer Standardfelder
 */
export const standardValidations = {
  email: [{ type: 'required' as const }, { type: 'email' as const }],
  name: [
    { type: 'required' as const },
    { type: 'min' as const, value: 2, message: 'Name muss mindestens 2 Zeichen haben' },
    { type: 'max' as const, value: 100, message: 'Name darf hoechstens 100 Zeichen haben' }
  ],
  plz: [
    { type: 'required' as const },
    { type: 'plz' as const }
  ],
  phone: [
    { type: 'required' as const },
    { type: 'phone' as const }
  ],
  message: [
    { type: 'required' as const },
    { type: 'min' as const, value: 10, message: 'Nachricht muss mindestens 10 Zeichen haben' },
    { type: 'max' as const, value: 5000, message: 'Nachricht darf hoechstens 5000 Zeichen haben' }
  ]
};
