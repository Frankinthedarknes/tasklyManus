/**
 * Password validation utility functions
 * Enforces security standards for user passwords
 */

export interface PasswordStrength {
  score: number; // 0-5
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

/**
 * Validates password strength and returns detailed feedback
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  } else {
    score += 1;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula");
  } else {
    score += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula");
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push("Debe contener al menos un número");
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (!@#$%^&*)");
  } else {
    score += 1;
  }

  // Generate suggestions
  if (password.length < 12) {
    suggestions.push("Considera usar una contraseña más larga (12+ caracteres)");
  }

  if (password.length > 20) {
    suggestions.push("Excelente: contraseña muy larga");
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push("Evita repetir caracteres consecutivos");
  }

  // Check for sequential patterns
  if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/.test(password.toLowerCase())) {
    suggestions.push("Evita patrones secuenciales");
  }

  return {
    score,
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "Muy débil";
    case 2:
      return "Débil";
    case 3:
      return "Moderada";
    case 4:
      return "Fuerte";
    case 5:
      return "Muy fuerte";
    default:
      return "Desconocida";
  }
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-lime-500";
    case 5:
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}
