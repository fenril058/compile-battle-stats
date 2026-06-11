import { type Analytics, getAnalytics } from "firebase/analytics";
import { type FirebaseApp, initializeApp } from "firebase/app";
import {
  type Auth,
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "../config/env";

/**
 * 認証 SDK 関数をハンドルに束ねたもの。
 *
 * useAuth が `import("firebase/auth")` を直接呼ばずに済むよう、初期化時に
 * 一括で取り込んで渡す。これには副次的な利点がある：firebase/auth の動的
 * import 点を `firebaseInit.ts` の 1 箇所に集約できるため、テストでは
 * `getFirebase` をモックするだけで認証フローを決定的に差し替えられる
 * （effect 内の動的 import が実モジュールを先にキャッシュしてしまう罠を回避）。
 */
export type AuthApi = {
  GoogleAuthProvider: typeof GoogleAuthProvider;
  getRedirectResult: typeof getRedirectResult;
  onAuthStateChanged: typeof onAuthStateChanged;
  signInWithPopup: typeof signInWithPopup;
  signInWithRedirect: typeof signInWithRedirect;
  signOut: typeof signOut;
};

/**
 * Firebase SDK の実体（app / db / auth / analytics）への参照と、認証 SDK 関数を
 * まとめたハンドル。remote モードのときだけ動的 import され、firebase チャンクの
 * 初回ロードを遅延させる。
 */
export type FirebaseHandles = {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  analytics: Analytics;
  authApi: AuthApi;
};

/**
 * Firebase を初期化してハンドルを返す。失敗時は null を返し、呼び出し側で
 * graceful degrade（LocalAdapter フォールバック等）する。
 *
 * 本番設定検出の安全装置（mode=test での throw）は呼び出し元の
 * `firebase.ts` トップレベルに残してあるため、ここには含めない。
 */
export function initFirebase(): FirebaseHandles | null {
  if (!FIREBASE_CONFIG) {
    console.warn(
      "[Firebase] Firebase environment variables not set. Running in LocalStorage mode.",
    );
    return null;
  }
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const analytics = getAnalytics(app);
    const db = getFirestore(app);
    const auth = getAuth(app);
    return {
      app,
      db,
      auth,
      analytics,
      authApi: {
        GoogleAuthProvider,
        getRedirectResult,
        onAuthStateChanged,
        signInWithPopup,
        signInWithRedirect,
        signOut,
      },
    };
  } catch (err) {
    console.error("[firebase] initialization failed:", err);
    return null;
  }
}
