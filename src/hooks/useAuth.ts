import type { User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useT } from "../i18n";
import { getFirebase, isFirebaseEnabled } from "../storage/firebase";

type AuthState = {
  user: User | null;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isAuthEnabled: boolean; // Firebaseが有効かどうかのフラグ
};

/**
 * 認証状態と操作を提供するカスタムフック。
 *
 * firebase/auth は静的 import しない（local モードで firebase チャンクを初回
 * ロードしないため）。auth インスタンスと SDK 関数は `getFirebase()` 経由で
 * 遅延取得する（`firebaseInit.ts` が firebase/auth を動的 import して `authApi`
 * に束ねる）。これにより firebase はエントリーグラフから切り離される。
 *
 * @returns {AuthState} 現在のユーザー、ログイン/ログアウト関数、Firebaseの有効状態
 */
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const { t } = useT();

  // 認証状態の監視 + リダイレクト認証の結果受け取り（コンポーネントマウント時に一度だけ実行）
  useEffect(() => {
    // Firebase が無効なら購読しない（local モードでは firebase を一切ロードしない）
    if (!isFirebaseEnabled) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const fb = await getFirebase();
      // init 失敗（fb=null）や、待機中にアンマウントされた場合は何もしない
      if (cancelled || !fb) return;
      const { getRedirectResult, onAuthStateChanged } = fb.authApi;

      // signInWithRedirect 後のリダイレクト結果を受け取る
      getRedirectResult(fb.auth).catch((error) => {
        console.error("Redirect login failed:", error);
        toast.error(t("auth.toast.loginFailed"));
      });

      const unsub = onAuthStateChanged(fb.auth, (currentUser) => {
        setUser(currentUser);
      });
      // 待機中にクリーンアップ済みなら即解除する
      if (cancelled) unsub();
      else unsubscribe = unsub;
    })();

    // クリーンアップ関数
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [t]);

  const handleLogin = useCallback(async () => {
    const fb = await getFirebase();
    if (!fb) {
      toast.error(t("auth.toast.notEnabled"));
      return;
    }
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
      fb.authApi;
    try {
      await signInWithPopup(fb.auth, new GoogleAuthProvider());
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
          await signInWithRedirect(fb.auth, new GoogleAuthProvider());
        } catch (redirectError) {
          console.error("Redirect login failed:", redirectError);
          toast.error(t("auth.toast.loginFailed"));
        }
      } else if (code === "auth/network-request-failed") {
        toast.error(t("auth.toast.adBlocker"), { autoClose: 8000 });
      } else {
        toast.error(t("auth.toast.loginFailed"));
      }
    }
  }, [t]);

  const handleLogout = useCallback(async () => {
    const fb = await getFirebase();
    if (!fb) return;
    const { signOut } = fb.authApi;
    try {
      await signOut(fb.auth);
      toast.info(t("auth.toast.loggedOut"));
    } catch (error) {
      console.error("Logout Failed:", error);
      toast.error(t("auth.toast.logoutFailed"));
    }
  }, [t]);

  return {
    user,
    handleLogin,
    handleLogout,
    // init 失敗時も true になり得るが、ログイン操作は getFirebase()=null で
    // 従来どおりエラートーストに落ちる。
    isAuthEnabled: isFirebaseEnabled,
  };
};
