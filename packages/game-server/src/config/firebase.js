import admin from "firebase-admin";

const hasServiceAccountEnv =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !!process.env.FIREBASE_CLIENT_EMAIL;

// Serverless safety:
// If Firebase env is missing/misconfigured, admin.credential.cert() throws at import-time.
// That can prevent the API handler from loading and surface as 404 in Vercel.
if (!admin.apps.length) {
  if (hasServiceAccountEnv) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL ||
        "https://cyber-edu-game-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
  } else {
    // Let the app boot (so routing/health works). Any db/auth usage will fail until env vars are set.
    // IMPORTANT: admin.database() needs a databaseURL; without it, the module import can crash,
    // and on Vercel that often surfaces as 404 (function failed to load).
    admin.initializeApp({
      databaseURL:
        process.env.FIREBASE_DATABASE_URL ||
        "https://cyber-edu-game-default-rtdb.asia-southeast1.firebasedatabase.app",
    });
  }
}

export const db = admin.database();
export const auth = admin.auth();