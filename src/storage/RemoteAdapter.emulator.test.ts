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

// rules が所有者ベース＋試合スキーマ検証になったため、テスト行も
// 有効な試合データ（userId=u1 所有）に name を付けた形にする。
type Row = {
  id: string;
  createdAt: number;
  name: string;
  userId: string;
  winner: "FIRST" | "SECOND";
  first: string[];
  second: string[];
  ratio: boolean;
};

// name だけ差し替えた、u1 所有の有効な試合データを作る。
const row = (name: string): Omit<Row, "id" | "createdAt"> => ({
  name,
  userId: "u1",
  winner: "FIRST",
  first: ["DARKNESS", "FIRE", "HATE"],
  second: ["PSYCHIC", "GRAVITY", "WATER"],
  ratio: false,
});

let testEnv: RulesTestEnvironment;

// emulator の gRPC サーバー（netty）にレスポンスフレーミングのバグがあり、
// 接続ごと落ちると SDK が commit 済みの write を再送して ALREADY_EXISTS で
// 失敗することがある（#199 調査）。WebChannel（long polling）で gRPC を回避する。
const longPolling = { experimentalForceLongPolling: true };

// rules-unit-testing の認証済みコンテキスト（uid=u1）から Firestore を取り出して
// RemoteAdapter に渡す。rules は create で userId == auth.uid を要求するため、
// 行データの userId も "u1" に揃える（上の row ヘルパー）。
const authedDb = (): Firestore =>
  testEnv
    .authenticatedContext("u1")
    .firestore(longPolling) as unknown as Firestore;

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

    // onSnapshot の接続（初期空スナップショット）を待ってから書き込み、
    // 「初期状態 → 書き込み反映」の順で snapshot が届くことを決定的にする。
    await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0), waitOpts);

    await adapter.add(row("alpha"));

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

    await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0), waitOpts);

    await adapter.addBatch([
      { ...row("a"), createdAt: 1 },
      { ...row("b"), createdAt: 2 },
      { ...row("c"), createdAt: 3 },
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

    await adapter.add(row("doomed"));
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
