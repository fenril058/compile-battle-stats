/**
 * 環境変数 (Vite) の読み込みと設定の集約
 * Firebaseの設定と、その他の環境依存設定をここで定義・検証します。
 */

// 1. Firebase設定の型定義
export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

// 2. 環境変数の取得と検証
const rawConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

/**
 * 設定値が有効（空文字ではない文字列）かどうかをチェックします。
 */
function isConfigValid(cfg: Record<string, unknown>): boolean {
  // 必須の Firebase Config のいずれかが空であれば、無効と判断する
  return Object.values(cfg).every((v) => typeof v === "string" && v.length > 0);
}

// 3. 外部モジュールに公開する設定
const isValid = isConfigValid(rawConfig);

/**
 * Firebase の設定オブジェクト
 * 設定が有効でない場合（.envが未設定など）は null を返します。
 * firebase.ts や useFirestore.ts は、この値によって LocalStorage モードへのフォールバックを判断します。
 */
export const FIREBASE_CONFIG: FirebaseConfig | null = isValid ? rawConfig : null;

/**
 * LocalStorage のキー。
 * .envに設定があればそれを使用し、なければデフォルト値を使用します。
 */
export const LOCAL_STORAGE_KEY: string =
  import.meta.env.VITE_LOCAL_STORAGE_KEY || "compile_stats_matches";
