// src/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase Config は .env から取得する想定（Vite）。
 * Vite の環境変数は VITE_ プレフィックスが必要です。
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

/**
 * 必須キーが欠けているか、値が空文字なら「未設定」とみなし、null を返します。
 * これにより、App 側で localStorage モードへ自然にフォールバック可能。
 */
function isConfigValid(cfg: Record<string, unknown>): boolean {
  return Object.values(cfg).every((v) => typeof v === "string" && v.length > 0);
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (isConfigValid(firebaseConfig)) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    // 未設定の場合は null のまま（App 側でモック使用）
    app = null;
    db = null;
    auth = null;
    if (import.meta.env.DEV) {
      console.warn("[firebase] config is invalid. Falling back to local mode.");
    }
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

export { app, db, auth, firebaseConfig, isFirebaseEnabled };
