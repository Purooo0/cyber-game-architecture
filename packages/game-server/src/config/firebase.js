import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
  __dirname,
  "../cyber-edu-game-firebase-adminsdk-fbsvc-cd7fbe4929.json"
);

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cyber-edu-game-default-rtdb.asia-southeast1.firebasedatabase.app"
});

export const db = admin.database();
export const auth = admin.auth();