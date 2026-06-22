export function validatePasswordStrength(value: string, rtl = false): string | null {
  if (value.length < 8 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9!@#$%^&*]/.test(value)) {
    return rtl
      ? 'يجب أن تتكون كلمة المرور من 8 أحرف وتتضمن حرفاً كبيراً وصغيراً ورقماً أو رمزاً.'
      : 'Password must be 8+ characters with upper/lower case and a number or symbol.';
  }
  return null;
}

export function getPasswordStrengthScore(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[0-9!@#$%^&*]/.test(value)) score += 1;
  return score;
}

export function getPasswordStrengthLabel(score: number, rtl = false): string {
  if (score <= 1) return rtl ? 'ضعيفة' : 'Weak';
  if (score === 2 || score === 3) return rtl ? 'متوسطة' : 'Fair';
  return rtl ? 'قوية' : 'Strong';
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
