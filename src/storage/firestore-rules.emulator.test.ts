import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
// firestore.rules を文字列として読み込む（Vite の ?raw、node:fs 不要）
import rulesSource from "../../firestore.rules?raw";

let testEnv: RulesTestEnvironment;

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

// userId 以外のフィールドが揃った有効な試合データ（所有者を引数で差し替える）。
const validMatch = (userId: string) => ({
  userId,
  winner: "FIRST",
  first: ["DARKNESS", "FIRE", "HATE"],
  second: ["PSYCHIC", "GRAVITY", "WATER"],
  ratio: false,
  createdAt: 1,
});

// ルール検証をバイパスして既存ドキュメントを仕込む（前提データ作成用）。
const seed = (path: string, data: Record<string, unknown>) =>
  testEnv.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), path), data),
  );

describe("firestore.rules（emulator・層②）所有者ベースの書き込み制御", () => {
  const path = "compile_season3/m1";

  it("read は未認証でも許可される", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, path)));
  });

  it("create は未認証では拒否される", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, path), validMatch("u1")));
  });

  it("create は userId == auth.uid なら許可される", async () => {
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertSucceeds(setDoc(doc(db, path), validMatch("u1")));
  });

  it("create で他人の userId を詐称すると拒否される", async () => {
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(db, path), validMatch("u2")));
  });

  it("create で必須フィールド欠落（スキーマ不正）は拒否される", async () => {
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertFails(setDoc(doc(db, path), { userId: "u1", winner: "FIRST" }));
  });

  it("create で winner が不正値だと拒否される", async () => {
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertFails(
      setDoc(doc(db, path), { ...validMatch("u1"), winner: "DRAW" }),
    );
  });

  it("所有者は自分の doc を更新できる", async () => {
    await seed(path, validMatch("u1"));
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertSucceeds(updateDoc(doc(db, path), { winner: "SECOND" }));
  });

  it("他人は所有者の doc を更新できない", async () => {
    await seed(path, validMatch("u1"));
    const db = testEnv.authenticatedContext("u2").firestore();
    await assertFails(updateDoc(doc(db, path), { winner: "SECOND" }));
  });

  it("所有者でも userId を他人へ付け替えることはできない", async () => {
    await seed(path, validMatch("u1"));
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertFails(updateDoc(doc(db, path), { userId: "u2" }));
  });

  it("所有者は自分の doc を削除できる", async () => {
    await seed(path, validMatch("u1"));
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertSucceeds(deleteDoc(doc(db, path)));
  });

  it("他人は所有者の doc を削除できない", async () => {
    await seed(path, validMatch("u1"));
    const db = testEnv.authenticatedContext("u2").firestore();
    await assertFails(deleteDoc(doc(db, path)));
  });

  it("userId を持たない過去データは閲覧できるが編集・削除できない", async () => {
    // userId フィールドの無いレガシードキュメント
    await seed(path, {
      winner: "FIRST",
      first: ["DARKNESS", "FIRE", "HATE"],
      second: ["PSYCHIC", "GRAVITY", "WATER"],
      ratio: false,
      createdAt: 1,
    });
    const reader = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(reader, path)));

    const writer = testEnv.authenticatedContext("u1").firestore();
    await assertFails(updateDoc(doc(writer, path), { winner: "SECOND" }));
    await assertFails(deleteDoc(doc(writer, path)));
  });
});
