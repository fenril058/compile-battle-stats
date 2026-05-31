import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalAdapter } from "./LocalAdapter";

type Row = { id: string; createdAt: number; name: string };

const KEY = "test_local_adapter";

const read = (): Row[] => {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Row[]) : [];
};

describe("LocalAdapter（StorageAdapter 契約）", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("subscribe は登録直後に現在値で一度発火する（空）", () => {
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith([]);
  });

  it("subscribe は既存の localStorage 内容を初回発火で返す", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([{ id: "a", createdAt: 1, name: "x" }]),
    );
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);
    expect(listener).toHaveBeenLastCalledWith([
      { id: "a", createdAt: 1, name: "x" },
    ]);
  });

  it("add は localStorage に追記し、購読者へ通知する", async () => {
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.add({ name: "first" } as Omit<Row, "id" | "createdAt">);

    const stored = read();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("first");
    expect(typeof stored[0].id).toBe("string");
    expect(typeof stored[0].createdAt).toBe("number");
    // 初回 + add で 2 回
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.lastCall?.[0]).toHaveLength(1);
  });

  it("addBatch は複数件を追記し、createdAt が数値なら保持する", async () => {
    const adapter = new LocalAdapter<Row>(KEY);

    await adapter.addBatch([
      { name: "p", createdAt: 100 } as Omit<Row, "id">,
      { name: "q", createdAt: 200 } as Omit<Row, "id">,
    ]);

    const stored = read();
    expect(stored).toHaveLength(2);
    // createdAt 降順で保存される
    expect(stored.map((r) => r.name)).toEqual(["q", "p"]);
    expect(stored.map((r) => r.createdAt)).toEqual([200, 100]);
    expect(stored.every((r) => typeof r.id === "string")).toBe(true);
  });

  it("addBatch は空配列なら何もしない", async () => {
    const adapter = new LocalAdapter<Row>(KEY);
    await adapter.addBatch([]);
    expect(read()).toHaveLength(0);
  });

  it("remove は id 指定で 1 件削除する", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: "a", createdAt: 1, name: "x" },
        { id: "b", createdAt: 2, name: "y" },
      ]),
    );
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.remove("a");

    const stored = read();
    expect(stored.map((r) => r.id)).toEqual(["b"]);
    expect(listener.mock.lastCall?.[0]).toEqual([
      { id: "b", createdAt: 2, name: "y" },
    ]);
  });

  it("読み出しは常に createdAt 降順", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: "a", createdAt: 1, name: "old" },
        { id: "b", createdAt: 3, name: "new" },
        { id: "c", createdAt: 2, name: "mid" },
      ]),
    );
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);
    expect(listener.mock.lastCall?.[0].map((r: Row) => r.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("unsubscribe 後は通知されない", async () => {
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    unsubscribe();
    listener.mockClear();

    await adapter.add({ name: "z" } as Omit<Row, "id" | "createdAt">);
    expect(listener).not.toHaveBeenCalled();
  });

  it("id が壊れたデータは読み出し時に UUID が補完される", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 123 as unknown as string, createdAt: 1, name: "x" },
      ]),
    );
    const adapter = new LocalAdapter<Row>(KEY);
    const listener = vi.fn();
    adapter.subscribe(listener);
    const got = listener.mock.lastCall?.[0][0] as Row;
    expect(typeof got.id).toBe("string");
    expect(got.id).not.toBe("123");
  });
});
