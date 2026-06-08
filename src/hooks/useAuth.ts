import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { auth, isFirebaseEnabled } from "../storage/firebase"; // Firebaseインスタンスをインポート

type AuthState = {
  user: User | null;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isAuthEnabled: boolean; // Firebaseが有効かどうかのフラグ
};

/**
 * 認証状態と操作を提供するカスタムフック。
 * @returns {AuthState} 現在のユーザー、ログイン/ログアウト関数、Firebaseの有効状態
 */
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);

  // 認証状態の監視 + リダイレクト認証の結果受け取り（コンポーネントマウント時に一度だけ実行）
  useEffect(() => {
    // Firebase Authが無効であれば購読しない
    if (!auth) return;

    // signInWithRedirect 後のリダイレクト結果を受け取る
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login failed:", error);
      toast.error("ログインに失敗しました。");
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback(async () => {
    if (!auth) {
      toast.error("Firebase認証が有効ではありません。");
      return;
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // onAuthStateChanged が state を更新するため、ここでは成功通知は不要
    } catch (error) {
      console.error("Login Failed:", error);
      const code =
        error instanceof Error && "code" in error
          ? (error as { code: string }).code
          : "";
      if (code === "auth/popup-blocked") {
        // ポップアップがブロックされた場合はリダイレクト方式にフォールバック
        try {
          await signInWithRedirect(auth, new GoogleAuthProvider());
        } catch (redirectError) {
          console.error("Redirect login failed:", redirectError);
          toast.error("ログインに失敗しました。");
        }
      } else if (code === "auth/network-request-failed") {
        toast.error(
          "ログインに失敗しました。広告ブロッカーがGoogleの認証をブロックしている可能性があります。このサイトをホワイトリストに追加してから再試行してください。",
          { autoClose: 8000 },
        );
      } else {
        toast.error("ログインに失敗しました。");
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast.info("ログアウトしました");
    } catch (error) {
      console.error("Logout Failed:", error);
      toast.error("ログアウトに失敗しました。");
    }
  }, []);

  return {
    user,
    handleLogin,
    handleLogout,
    isAuthEnabled: isFirebaseEnabled, // firebase.tsから取得したフラグ
  };
};
