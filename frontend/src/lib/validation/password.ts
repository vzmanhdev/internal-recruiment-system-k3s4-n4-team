/**
 * Chuẩn hóa chính sách mật khẩu mạnh (Strong Password Policy) toàn hệ thống:
 * 1. Tối thiểu 8 ký tự (length >= 8)
 * 2. Có ít nhất một chữ cái thường (a-z)
 * 3. Có ít nhất một chữ cái in hoa (A-Z)
 * 4. Có ít nhất một chữ số (0-9)
 * 5. Có ít nhất một ký tự đặc biệt (!@#$%^&*...)
 */

export interface PasswordRulesState {
  minLength: boolean;     // >= 8 ký tự
  hasLowercase: boolean;  // a-z
  hasUppercase: boolean;  // A-Z
  hasNumber: boolean;     // 0-9
  hasSpecialChar: boolean;// Ký tự đặc biệt
  isValid: boolean;
}

export const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export function checkPasswordRules(password: string): PasswordRulesState {
  const pwd = password || "";
  const minLength = pwd.length >= 8;
  const hasLowercase = /[a-z]/.test(pwd);
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = PASSWORD_SPECIAL_REGEX.test(pwd);
  const isValid = minLength && hasLowercase && hasUppercase && hasNumber && hasSpecialChar;

  return {
    minLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
    isValid,
  };
}

export function getPasswordValidationErrorMessage(
  rules: PasswordRulesState,
  fieldName: string = "Mật khẩu"
): string {
  if (rules.isValid) return "";
  const missing: string[] = [];
  if (!rules.minLength) missing.push("tối thiểu 8 ký tự");
  if (!rules.hasLowercase) missing.push("chữ cái thường (a-z)");
  if (!rules.hasUppercase) missing.push("chữ in hoa (A-Z)");
  if (!rules.hasNumber) missing.push("chữ số (0-9)");
  if (!rules.hasSpecialChar) missing.push("ký tự đặc biệt (!@#$%^&*...)");

  return `${fieldName} chưa đạt chuẩn an toàn: cần bổ sung ${missing.join(", ")}.`;
}
