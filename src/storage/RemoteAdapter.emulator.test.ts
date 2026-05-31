import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import rulesSource from "../../firestore.rules?raw";
import { RemoteAdapter } from "./RemoteAdapter";

type Row = { id: string; createdAt: number; name: string };

let testEnv: RulesTestEnvironment;

// rules-unit-testing の認証済みコンテキストから Firestore を取り出して RemoteAdapter に渡す。
// （rules は write=認証必須なので、未認証だと書き込みが拒否される）
const authedDb = (): Firestore =>
  testEnv.authenticatedContext("u1").firestore() as unknown as Firestore;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-compile",
    firestore: { rules: rulesSource },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const waitOpts = { timeout: 10000, interval: 50 } as const;

describe("RemoteAdapter（emulator 統合・層②）", () => {
  it("add → onSnapshot に反映され id が採番される", async () => {
    // 注: serverTimestamp の number 化は RemoteAdapter.test.ts（モック）で検証済み。
    // emulator+node では pending→確定の反映タイミングが不安定なため、ここでは往復のみ検証する。
    const adapter = new RemoteAdapter<Row>(authedDb(), "compile_season3");
    const seen: Row[][] = [];
    const unsub = adapter.subscribe((items) => seen.push(items));

    await adapter.add({ name: "alpha" } as Omit<Row, "id" | "createdAt">);

    await vi.waitFor(() => {
      const hit = (seen.at(-1) ?? []).find((r) => r.name === "alpha");
      expect(hit).toBeDefined();
      expect(typeof hit?.id).toBe("string");
    }, waitOpts);
    unsub();
  });

  it("addBatch → 全件が onSnapshot に反映される", async () => {
    // RemoteAdapter は snapshot をそのまま流す（ソートは下流の責務）ので順序は問わない
    const adapter = new RemoteAdapter<Row>(authedDb(), "compile_season3");
    const seen: Row[][] = [];
    const unsub = adapter.subscribe((items) => seen.push(items));

    await adapter.addBatch([
      { name: "a", createdAt: 1 } as Omit<Row, "id">,
      { name: "b", createdAt: 2 } as Omit<Row, "id">,
      { name: "c", createdAt: 3 } as Omit<Row, "id">,
    ]);

    await vi.waitFor(() => {
      expect(seen.at(-1) ?? []).toHaveLength(3);
    }, waitOpts);
    expect((seen.at(-1) ?? []).map((r) => r.name).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
    unsub();
  });

  it("remove → onSnapshot から消える", async () => {
    const adapter = new RemoteAdapter<Row>(authedDb(), "compile_season3");
    const seen: Row[][] = [];
    const unsub = adapter.subscribe((items) => seen.push(items));

    await adapter.add({ name: "doomed" } as Omit<Row, "id" | "createdAt">);
    await vi.waitFor(() => {
      expect((seen.at(-1) ?? []).some((r) => r.name === "doomed")).toBe(true);
    }, waitOpts);

    const id = (seen.at(-1) ?? []).find((r) => r.name === "doomed")?.id;
    expect(id).toBeDefined();
    if (id) await adapter.remove(id);

    await vi.waitFor(() => {
      expect((seen.at(-1) ?? []).some((r) => r.name === "doomed")).toBe(false);
    }, waitOpts);
    unsub();
  });
});
