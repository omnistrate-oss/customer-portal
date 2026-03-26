export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export const passwordText =
  "Password must be at least 8 characters and include a mix of uppercase, lowercase, a number, and a special character (e.g., !@#$%^&*).";

export const passwordMatchesEmailText = "Email cannot be used as password";

export function isPasswordSameAsEmail(password, email) {
  if (!password || !email) return false;
  return password.toLowerCase() === email.toLowerCase();
}
