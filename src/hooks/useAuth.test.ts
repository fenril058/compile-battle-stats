import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Firebase 認証 SDK のモック関数 ---
// useAuth は firebase/auth を直接 import せず、getFirebase() が返すハンドルの
// authApi 経由で SDK 関数を受け取る。よってここでモック関数を用意し、
// getFirebase の戻り値の authApi に注入する（firebase/auth 自体はモックしない）。
const mockSignInWithPopup = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockSignOut = vi.fn();
const mockGetRedirectResult = vi.fn().mockResolvedValue(null);
const mockOnAuthStateChanged = vi.fn();
// class として扱われるので function コンストラクタで定義する
const mockGoogleAuthProvider = vi.fn(function GoogleAuthProvider(
  this: unknown,
) {});

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// auth が有効な状態を基本とする（vi.mock の factory 内で参照するため hoisted にする）
const mockAuth = vi.hoisted(() => ({ name: "mock-auth" }));

// getFirebase() が返すハンドル。authApi にモック関数を束ねる。
const makeHandle = () => ({
  auth: mockAuth,
  authApi: {
    GoogleAuthProvider: mockGoogleAuthProvider,
    getRedirectResult: (...args: unknown[]) => mockGetRedirectResult(...args),
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
    signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
    signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
});

// 遅延初期化リファクタ後は auth を直接公開せず getFirebase() 経由で取得する。
// isFirebaseEnabled=true かつ getFirebase がハンドルを返す状態を基本とする。
vi.mock("../storage/firebase", () => ({
  isFirebaseEnabled: true,
  getFirebase: vi.fn(),
}));

import { toast } from "react-toastify";
import { getFirebase } from "../storage/firebase";
import { useAuth } from "./useAuth";

type AuthCallback = (user: unknown) => void;

// onAuthStateChanged が返す unsubscribe と、登録された cb への参照を保持する。
// beforeEach で既定のスタブを張るが、triggerAuth / unsubscribe ハンドルが必要な
// テストでは、その参照を受け取るために各テスト内で再度呼び直す。
const setupOnAuthStateChanged = (unsubscribe = vi.fn()) => {
  let registeredCb: AuthCallback | null = null;
  mockOnAuthStateChanged.mockImplementation(
    (_auth: unknown, cb: AuthCallback) => {
      registeredCb = cb;
      return unsubscribe;
    },
  );
  return {
    triggerAuth: (user: unknown) => {
      if (registeredCb) act(() => registeredCb?.(user));
    },
    unsubscribe,
  };
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks は mockResolvedValue 実装も消すため、getFirebase を張り直す。
    vi.mocked(getFirebase).mockResolvedValue(
      makeHandle() as unknown as Awaited<ReturnType<typeof getFirebase>>,
    );
    mockGetRedirectResult.mockResolvedValue(null);
    setupOnAuthStateChanged();
  });

  it("初期 user は null", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it("isAuthEnabled が true を返す", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthEnabled).toBe(true);
  });

  it("onAuthStateChanged のコールバックが user を更新する", async () => {
    const fakeUser = { uid: "abc" };
    const { triggerAuth } = setupOnAuthStateChanged();
    const { result } = renderHook(() => useAuth());
    // effect は getFirebase + 動的 import を await するため、購読登録を待つ
    await waitFor(() => expect(mockOnAuthStateChanged).toHaveBeenCalled());
    triggerAuth(fakeUser);
    expect(result.current.user).toEqual(fakeUser);
  });

  it("アンマウント時に onAuthStateChanged のサブスクリプションを解除する", async () => {
    const { unsubscribe } = setupOnAuthStateChanged();
    const { unmount } = renderHook(() => useAuth());
    // 購読登録が完了してから unmount する（async effect のため）
    await waitFor(() => expect(mockOnAuthStateChanged).toHaveBeenCalled());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("getRedirectResult がエラーになったらエラートーストを表示する", async () => {
    mockGetRedirectResult.mockRejectedValue(new Error("redirect error"));
    setupOnAuthStateChanged();
    renderHook(() => useAuth());
    // useEffect 内の getRedirectResult().catch() がトーストを呼ぶまで待つ
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインに失敗しました。");
    });
  });

  it("handleLogin が signInWithPopup を呼ぶ", async () => {
    mockSignInWithPopup.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin();
    });
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });

  it("popup-blocked のとき redirect にフォールバックする", async () => {
    const err = Object.assign(new Error("popup-blocked"), {
      code: "auth/popup-blocked",
    });
    mockSignInWithPopup.mockRejectedValue(err);
    mockSignInWithRedirect.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin();
    });
    expect(mockSignInWithRedirect).toHaveBeenCalled();
  });

  it("redirect フォールバックがエラーになったらエラートーストを表示する", async () => {
    const err = Object.assign(new Error("popup-blocked"), {
      code: "auth/popup-blocked",
    });
    mockSignInWithPopup.mockRejectedValue(err);
    mockSignInWithRedirect.mockRejectedValue(new Error("redirect failed"));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin();
    });
    expect(toast.error).toHaveBeenCalledWith("ログインに失敗しました。");
  });

  it("network-request-failed のとき広告ブロッカーメッセージを表示する", async () => {
    const err = Object.assign(new Error("network"), {
      code: "auth/network-request-failed",
    });
    mockSignInWithPopup.mockRejectedValue(err);
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin();
    });
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("広告ブロッカー"),
      expect.objectContaining({ autoClose: 8000 }),
    );
  });

  it("その他のエラーのとき汎用エラートーストを表示する", async () => {
    const err = Object.assign(new Error("other"), { code: "auth/other" });
    mockSignInWithPopup.mockRejectedValue(err);
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin();
    });
    expect(toast.error).toHaveBeenCalledWith("ログインに失敗しました。");
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  it("handleLogout が signOut を呼んで info トーストを表示する", async () => {
    mockSignOut.mockResolvedValue({});
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(mockSignOut).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith("ログアウトしました");
  });

  it("handleLogout がエラーになったらエラートーストを表示する", async () => {
    mockSignOut.mockRejectedValue(new Error("signout failed"));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(toast.error).toHaveBeenCalledWith("ログアウトに失敗しました。");
  });
});
