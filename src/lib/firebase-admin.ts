import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

if (getApps().length === 0) {
  // Load service account JSON file directly from project root
  const serviceAccountPath = path.join(
    process.cwd(),
    "service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "service-account.json not found in project root.\n" +
        "Download it from Firebase Console → ⚙️ → Service Accounts → Generate New Private Key\n" +
        "and place it at: " +
        serviceAccountPath
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminDb = getFirestore();