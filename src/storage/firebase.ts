import { FIREBASE_CONFIG } from "../config/env";
import type { FirebaseHandles } from "./firebaseInit";

// テスト（Vitest, mode=test）で本番 Firebase 設定が紛れ込むのを防ぐ安全装置。
// 通常は .env.test が VITE_FIREBASE_* を空にするので FIREBASE_CONFIG は null となり発火しない。
// 万一 .env.test が効かず本番資格情報が載った場合に、実 Firestore へ接続する前にここで止める。
// （動的 import より前の同期トップレベルに置く：意味を変えないため）
if (import.meta.env.MODE === "test" && FIREBASE_CONFIG) {
  throw new Error(
    "[firebase] テスト中に本番 Firebase 設定が検出されました。" +
      ".env.test で VITE_FIREBASE_* を空にしてください（本番 Firestore への接続防止）。",
  );
}

/**
 * Firebase が有効かどうか（設定ベース・同期判定）。
 * 従来は init 成功ベースだったが、初期化失敗は後段で graceful degrade する方針に変更した。
 * これにより firebase/* を静的 import せずにモードを決定でき、local モードでは
 * firebase チャンクが初回ロードされない。
 */
export const isFirebaseEnabled = FIREBASE_CONFIG !== null;

// getFirebase() の結果を 1 つの Promise にメモ化する（多重初期化を防ぐ）。
let handlesPromise: Promise<FirebaseHandles | null> | null = null;

/**
 * Firebase ハンドル（app / db / auth / analytics）を遅延取得する。
 *
 * - disabled（FIREBASE_CONFIG === null）なら null を即 resolve する。
 * - 有効なら `firebaseInit.ts` を動的 import して初期化する。これにより
 *   firebase/* はエントリーグラフから切り離され、remote のときだけ読み込まれる。
 * - 初期化失敗時も null を返し、呼び出し側で degrade する。
 */
export function getFirebase(): Promise<FirebaseHandles | null> {
  if (!isFirebaseEnabled) return Promise.resolve(null);
  if (!handlesPromise) {
    handlesPromise = import("./firebaseInit").then((m) => m.initFirebase());
  }
  return handlesPromise;
}
