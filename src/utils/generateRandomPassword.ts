const CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
// Bytes at or above this would make some characters more likely than others.
const UNBIASED_LIMIT = 256 - (256 % CHARACTERS.length);

export const generateRandomPassword = (length = 12): string => {
  let password = "";

  while (password.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length))) {
      if (byte < UNBIASED_LIMIT && password.length < length) {
        password += CHARACTERS[byte % CHARACTERS.length];
      }
    }
  }

  return password;
};
