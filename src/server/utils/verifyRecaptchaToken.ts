const axios = require("axios");

//This function takes the token provided by the google recaptcha client widget as input and verifies it using the google captcha verification API
//Returns true if the verification is successful or if the quota limit has been exceeded, else returns false
async function verifyRecaptchaToken(token: unknown) {
  if (typeof token !== "string" || !token.trim()) return false;

  const secret = process.env.GOOGLE_RECAPTCHA_SECRET_KEY || "";
  const formData = new URLSearchParams({ secret, response: token });

  let isVerified = false;

  try {
    const googleAPIResponse = await axios.post("https://www.google.com/recaptcha/api/siteverify", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (googleAPIResponse?.data?.success === true) isVerified = true;
    else isVerified = false;
  } catch {
    isVerified = false;
  }

  if (isVerified) return true;
  else return false;
}

module.exports = {
  verifyRecaptchaToken: verifyRecaptchaToken,
};
