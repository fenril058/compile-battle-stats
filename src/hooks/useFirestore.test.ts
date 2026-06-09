import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Firebase 未設定（db=null）= local モードを強制する
vi.mock("../storage/firebase", () => ({ db: null }));

// firestore SDK は local モードでは呼ばれないが、import 解決のためにスタブ化
vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "react-toastify";
import { LocalAdapter } from "../storage/LocalAdapter";
import { useFirestore } from "./useFirestore";

type Row = { id: string; createdAt: number; name: string };

const KEY = "test_collection";

const seed = (rows: Row[]) => localStorage.setItem(KEY, JSON.stringify(rows));

describe("useFirestore (local モード)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("db が無ければ mode は 'local'", () => {
    const { result } = renderHook(() => useFirestore<Row>(KEY));
    expect(result.current.mode).toBe("local");
  });

  it("マウント時に localStorage のキャッシュを読み込む", async () => {
    seed([
      { id: "a", createdAt: 1, name: "old" },
      { id: "b", createdAt: 2, name: "new" },
    ]);

    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("add は state と localStorage に追記し成功通知する", async () => {
    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await act(async () => {
      await result.current.add({ name: "added" } as Omit<
        Row,
        "id" | "createdAt"
      >);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("added");
    expect(result.current.items[0].id).toBeTypeOf("string");
    expect(toast.success).toHaveBeenCalled();

    // localStorage にも永続化されている
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("added");
  });

  it("remove は指定 id を state と localStorage から消す", async () => {
    seed([
      { id: "keep", createdAt: 1, name: "keep" },
      { id: "drop", createdAt: 2, name: "drop" },
    ]);
    const { result } = renderHook(() => useFirestore<Row>(KEY));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.remove("drop");
    });

    expect(result.current.items.map((r) => r.id)).toEqual(["keep"]);
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    expect(stored.map((r: Row) => r.id)).toEqual(["keep"]);
    expect(toast.success).toHaveBeenCalled();
  });

  it("remove が permission-denied で失敗したら所有者向けの理由を出す", async () => {
    // rules が所有者以外の削除を弾いたケース（remote 想定だが、duck-typing の
    // 分岐は adapter の例外だけで決まるので local の足場でも検証できる）。
    const spy = vi
      .spyOn(LocalAdapter.prototype, "remove")
      .mockRejectedValueOnce(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
      );
    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await act(async () => {
      await result.current.remove("any");
    });

    expect(toast.error).toHaveBeenCalledWith(
      "自分が登録した試合のみ削除できます。",
    );
    expect(toast.success).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("remove が code 無しのエラーで失敗したら汎用メッセージを出す", async () => {
    const spy = vi
      .spyOn(LocalAdapter.prototype, "remove")
      .mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await act(async () => {
      await result.current.remove("any");
    });

    expect(toast.error).toHaveBeenCalledWith("削除に失敗しました。");
    spy.mockRestore();
  });

  it("reloadLocal は localStorage を読み戻し info を出す", async () => {
    const { result } = renderHook(() => useFirestore<Row>(KEY));
    expect(result.current.items).toHaveLength(0);

    // フックの外部で localStorage を書き換えてから再読込
    seed([{ id: "x", createdAt: 1, name: "x" }]);
    act(() => {
      result.current.reloadLocal();
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(toast.info).toHaveBeenCalled();
  });

  it("addBatch は local モードでも localStorage へ登録し成功通知する（#48 B）", async () => {
    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await act(async () => {
      await result.current.addBatch([
        { name: "a", createdAt: 100 } as Omit<Row, "id">,
        { name: "b", createdAt: 200 } as Omit<Row, "id">,
      ]);
    });

    expect(result.current.items).toHaveLength(2);
    expect(toast.success).toHaveBeenCalled();

    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    expect(stored).toHaveLength(2);
  });

  it("addBatch は空配列なら info を出して何もしない", async () => {
    const { result } = renderHook(() => useFirestore<Row>(KEY));

    await act(async () => {
      await result.current.addBatch([]);
    });

    expect(result.current.items).toHaveLength(0);
    expect(toast.info).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("clearLocal は確認後に state と localStorage を空にする", async () => {
    seed([{ id: "x", createdAt: 1, name: "x" }]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = renderHook(() => useFirestore<Row>(KEY));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => {
      result.current.clearLocal();
    });

    expect(result.current.items).toHaveLength(0);
    expect(localStorage.getItem(KEY)).toBeNull();
    confirmSpy.mockRestore();
  });
});
