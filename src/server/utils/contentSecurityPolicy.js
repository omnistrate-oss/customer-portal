const NONCE_POLICY_HEADER = "Content-Security-Policy-Report-Only";

const buildContentSecurityPolicy = (nonce) => {
  const scriptNonce = nonce ? ` 'nonce-${nonce}' 'strict-dynamic'` : "";
  const inlineScript = nonce ? "" : " 'unsafe-inline'";

  return `default-src 'self'; script-src 'self'${scriptNonce} https://www.googletagmanager.com https://accounts.google.com/gsi/client https://www.google.com https://www.gstatic.com https://js.stripe.com 'unsafe-eval'${inlineScript} https://cdn.jsdelivr.net; worker-src 'self' blob: https://www.google.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; connect-src *; img-src * data:; media-src *; frame-src * https://js.stripe.com https://hooks.stripe.com; object-src 'none'; form-action 'self'; base-uri 'self'`;
};

module.exports = { buildContentSecurityPolicy, NONCE_POLICY_HEADER };
