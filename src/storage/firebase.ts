import { type Analytics, getAnalytics } from "firebase/analytics";
import { type FirebaseApp, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../config/env";

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// テスト（Vitest, mode=test）で本番 Firebase 設定が紛れ込むのを防ぐ安全装置。
// 通常は .env.test が VITE_FIREBASE_* を空にするので FIREBASE_CONFIG は null となり発火しない。
// 万一 .env.test が効かず本番資格情報が載った場合に、実 Firestore へ接続する前にここで止める。
// （try より前に置く：下の try に入れると catch に飲まれてしまうため）
if (import.meta.env.MODE === "test" && FIREBASE_CONFIG) {
  throw new Error(
    "[firebase] テスト中に本番 Firebase 設定が検出されました。" +
      ".env.test で VITE_FIREBASE_* を空にしてください（本番 Firestore への接続防止）。",
  );
}

try {
  if (FIREBASE_CONFIG) {
    app = initializeApp(FIREBASE_CONFIG);
    analytics = getAnalytics(app);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn(
      "[Firebase] Firebase environment variables not set. Running in LocalStorage mode.",
    );
  }
} catch (err) {
  // 例外発生時も null を返却
  app = null;
  analytics = null;
  db = null;
  auth = null;
  console.error("[firebase] initialization failed:", err);
}

// App 側でモード表示などに使えるフラグ
const isFirebaseEnabled = !!db;

export { analytics, app, auth, db, isFirebaseEnabled };
