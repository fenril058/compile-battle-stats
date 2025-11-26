// src/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { FIREBASE_CONFIG } from "./config/env";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (FIREBASE_CONFIG) {
    app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn("[Firebase] Firebase environment variables not set. Running in LocalStorage mode.");
  }
} catch (err) {
  // 例外発生時も null を返却
  app = null;
  db = null;
  auth = null;
  console.error("[firebase] initialization failed:", err);
}


// App 側でモード表示などに使えるフラグ
const isFirebaseEnabled = !!db;

export { app, db, auth, isFirebaseEnabled };
