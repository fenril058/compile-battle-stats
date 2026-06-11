import { beforeEach, describe, expect, it, vi } from "vitest";

// onSnapshot に渡される success / error コールバックの最小型
type SnapNext = (snap: {
  docs: {
    id: string;
    data: (options?: { serverTimestamps?: string }) => Record<string, unknown>;
  }[];
}) => void;
type SnapError = (error: unknown) => void;

// firebase/firestore を完全にモック（実通信は発生しない＝層①・本番ゼロリスク）。
// onSnapshot のコールバックを手元に捕捉し、テストから手動で発火できるようにする。
const fs = vi.hoisted(() => {
  const captured: { next?: SnapNext; error?: SnapError } = {};
  const unsub = vi.fn();
  const setMock = vi.fn();
  const commitMock = vi.fn();
  return {
    captured,
    unsub,
    setMock,
    commitMock,
    collection: vi.fn((_db: unknown, name: string) => ({ __col: name })),
    doc: vi.fn((...args: unknown[]) => ({ __doc: args })),
    onSnapshot: vi.fn((_ref: unknown, next: SnapNext, error: SnapError) => {
      captured.next = next;
      captured.error = error;
      return unsub;
    }),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    writeBatch: vi.fn(() => ({ set: setMock, commit: commitMock })),
    serverTimestamp: vi.fn(() => "SERVER_TS"),
  };
});

vi.mock("firebase/firestore", () => ({
  collection: fs.collection,
  doc: fs.doc,
  onSnapshot: fs.onSnapshot,
  addDoc: fs.addDoc,
  deleteDoc: fs.deleteDoc,
  writeBatch: fs.writeBatch,
  serverTimestamp: fs.serverTimestamp,
}));

import type { Firestore } from "firebase/firestore";
import { RemoteAdapter } from "./RemoteAdapter";

type Row = { id: string; createdAt: number; name: string };

const KEY = "col";
const db = { __db: true } as unknown as Firestore;

describe("RemoteAdapter（firebase/firestore モック・層①）", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    fs.captured.next = undefined;
    fs.captured.error = undefined;
  });

  it("subscribe は onSnapshot を購読し、Timestamp を number に変換して listener とキャッシュへ反映する", () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);

    expect(fs.onSnapshot).toHaveBeenCalledTimes(1);

    // サーバからの snapshot を手動で発火（createdAt は Timestamp 風オブジェクト）
    fs.captured.next?.({
      docs: [
        {
          id: "d1",
          data: () => ({ name: "x", createdAt: { toMillis: () => 1000 } }),
        },
      ],
    });

    expect(listener).toHaveBeenLastCalledWith([
      { name: "x", id: "d1", createdAt: 1000 },
    ]);

    // localStorage にキャッシュされている
    const cached = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    expect(cached).toEqual([{ name: "x", id: "d1", createdAt: 1000 }]);
  });

  it('subscribe の onSnapshot ハンドラは data({ serverTimestamps: "estimate" }) を呼ぶ（latency compensation 中の null 回避）', () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    adapter.subscribe(vi.fn());

    const dataFn = vi.fn(() => ({
      name: "z",
      createdAt: { toMillis: () => 2000 },
    }));

    fs.captured.next?.({
      docs: [{ id: "d2", data: dataFn }],
    });

    expect(dataFn).toHaveBeenCalledWith({ serverTimestamps: "estimate" });
  });

  it("subscribe は購読開始時に既存キャッシュで即時描画する", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([{ id: "c1", createdAt: 1, name: "cached" }]),
    );
    const adapter = new RemoteAdapter<Row>(db, KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);

    expect(listener).toHaveBeenLastCalledWith([
      { id: "c1", createdAt: 1, name: "cached" },
    ]);
  });

  it("onSnapshot エラー時はキャッシュを listener に渡し onError を呼ぶ", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([{ id: "c1", createdAt: 1, name: "cached" }]),
    );
    const adapter = new RemoteAdapter<Row>(db, KEY);
    const listener = vi.fn();
    const onError = vi.fn();
    adapter.subscribe(listener, onError);

    const boom = new Error("boom");
    fs.captured.error?.(boom);

    expect(listener).toHaveBeenLastCalledWith([
      { id: "c1", createdAt: 1, name: "cached" },
    ]);
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it("subscribe の戻り値は onSnapshot の unsubscribe", () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    const unsubscribe = adapter.subscribe(vi.fn());
    expect(unsubscribe).toBe(fs.unsub);
  });

  it("add は addDoc を colRef・serverTimestamp 付きで呼び、id は送らない", async () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    await adapter.add({ name: "y" } as Omit<Row, "id" | "createdAt">);

    expect(fs.addDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = fs.addDoc.mock.calls[0];
    expect(ref).toEqual({ __col: KEY });
    expect(data).toMatchObject({ name: "y", createdAt: "SERVER_TS" });
    expect(data).not.toHaveProperty("id");
  });

  it("addBatch は件数分 set して commit する（createdAt は数値なら保持・無ければ補完）", async () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    await adapter.addBatch([
      { name: "a", createdAt: 5 } as Omit<Row, "id">,
      { name: "b" } as unknown as Omit<Row, "id">,
    ]);

    expect(fs.writeBatch).toHaveBeenCalledTimes(1);
    expect(fs.setMock).toHaveBeenCalledTimes(2);
    expect(fs.commitMock).toHaveBeenCalledTimes(1);

    expect(fs.setMock.mock.calls[0][1]).toMatchObject({
      name: "a",
      createdAt: 5,
    });
    expect(typeof fs.setMock.mock.calls[1][1].createdAt).toBe("number");
  });

  it("addBatch は空配列なら commit しない", async () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    await adapter.addBatch([]);
    expect(fs.writeBatch).not.toHaveBeenCalled();
    expect(fs.commitMock).not.toHaveBeenCalled();
  });

  it("remove は doc(db, key, id) を deleteDoc に渡す", async () => {
    const adapter = new RemoteAdapter<Row>(db, KEY);
    await adapter.remove("d1");

    expect(fs.doc).toHaveBeenCalledWith(db, KEY, "d1");
    expect(fs.deleteDoc).toHaveBeenCalledTimes(1);
    expect(fs.deleteDoc.mock.calls[0][0]).toEqual({ __doc: [db, KEY, "d1"] });
  });
});
