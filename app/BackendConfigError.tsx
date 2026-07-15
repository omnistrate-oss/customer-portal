import { CSSProperties } from "react";

// Full-page error shown when the app cannot bootstrap — e.g. the root layout's
// provider auth call fails because the provider account has password login
// disabled and no API key configured. Rendered from app/layout.tsx (on catch)
// and app/global-error.tsx (backstop). It renders its own <html>/<body> with
// plain markup + inline styles because it runs outside RootProviders (the theme
// and Emotion cache that are unavailable when bootstrap fails). The cause detail
// is shown only in development so it never leaks to end customers in production.

const isDevelopment = process.env.NODE_ENV !== "production";

const styles: Record<string, CSSProperties> = {
  body: { margin: 0, height: "100%", backgroundColor: "white", fontFamily: '"Inter", sans-serif' },
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundImage: 'url("/assets/images/non-dashboard/wave-background.svg")',
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    padding: "24px",
  },
  heading: { marginBottom: 8, textAlign: "center" },
  subtext: { marginTop: 0, marginBottom: 48, textAlign: "center", color: "#475467", maxWidth: 536 },
  card: {
    boxShadow: "0px 4px 6px -4px #1018281a, 0px 10px 15px -3px #1018281a",
    borderRadius: 12,
    padding: "40px 20px",
    width: "100%",
    maxWidth: 536,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
  },
  image: { maxWidth: "100%", height: "auto" },
  detail: { margin: "24px 0 0", textAlign: "center", color: "#475467", fontWeight: 500 },
};

const BackendConfigError = ({ detail }: { detail?: string }) => (
  <html lang="en">
    <body style={styles.body}>
      <div style={styles.container}>
        <h2 style={styles.heading}>{isDevelopment ? "Portal configuration error" : "Something went wrong"}</h2>
        <p style={styles.subtext}>
          {isDevelopment
            ? "The portal couldn't authenticate with Omnistrate."
            : "This portal is temporarily unavailable. Please try again in a few minutes."}
        </p>
        <div style={styles.card}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDevelopment ? "/assets/images/setup-error.png" : "/assets/images/error.png"}
            alt="error"
            style={styles.image}
          />
          {isDevelopment && detail ? <p style={styles.detail}>{detail}</p> : null}
        </div>
      </div>
    </body>
  </html>
);

export default BackendConfigError;
