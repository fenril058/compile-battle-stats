import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
// firestore.rules を文字列として読み込む（Vite の ?raw、node:fs 不要）
import rulesSource from "../firestore.rules?raw";

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

// firestore.rules: read は誰でも / write は認証済みのみ
describe("firestore.rules（emulator・層②）", () => {
  const path = "compile_season3/m1";

  it("read は未認証でも許可される", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, path)));
  });

  it("write は未認証では拒否される", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, path), { winner: "FIRST" }));
  });

  it("write は認証済みなら許可される", async () => {
    const db = testEnv.authenticatedContext("u1").firestore();
    await assertSucceeds(setDoc(doc(db, path), { winner: "FIRST" }));
  });
});
