import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { auth, isFirebaseEnabled } from "../firebase"; // Firebaseインスタンスをインポート

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

  // 認証状態の監視（コンポーネントマウント時に一度だけ実行）
  useEffect(() => {
    // Firebase Authが無効であれば購読しない
    if (!auth) return;

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
      toast.error("ログインに失敗しました。");
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
