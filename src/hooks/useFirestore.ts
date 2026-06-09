import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../storage/firebase";
import { readLocal } from "../storage/helpers";
import { LocalAdapter } from "../storage/LocalAdapter";
import { RemoteAdapter } from "../storage/RemoteAdapter";
import type { StorageAdapter, WithId } from "../storage/types";
import type { StorageMode } from "../types";

/**
 * データアクセス層。ストレージの実体（Firestore / localStorage）は `StorageAdapter`
 * に隠蔽し、このフックは「購読 → state 反映」「操作 → トースト通知」だけを担う。
 * そのため firebase/firestore は直接 import しない（remote の実体は RemoteAdapter）。
 */
export function useFirestore<T extends WithId>(collectionName: string) {
  const localKey = collectionName;
  const [items, setItems] = useState<T[]>([]);
  const mode: StorageMode = db ? "remote" : "local";

  // db の有無でアダプタを選ぶ。collectionName が変わらない限り同一インスタンス。
  const adapter = useMemo<StorageAdapter<T>>(
    () =>
      db
        ? new RemoteAdapter<T>(db, collectionName)
        : new LocalAdapter<T>(collectionName),
    [collectionName],
  );

  // 購読：アダプタが現在値（および以降の変更）を push し、state へ反映する。
  useEffect(() => {
    const unsubscribe = adapter.subscribe(
      (next) => setItems(next),
      () => {
        toast.error(
          "リモートデータの同期に失敗しました。ローカルキャッシュを表示します。",
        );
      },
    );
    return unsubscribe;
  }, [adapter]);

  const add = useCallback(
    async (item: Omit<T, "id" | "createdAt">) => {
      try {
        await adapter.add(item);
        toast.success("試合を追加しました。");
      } catch (e) {
        console.error("[useFirestore] add failed:", e);
        toast.error("登録に失敗しました。");
      }
    },
    [adapter],
  );

  const remove = useCallback(
    async (idToRemove: string) => {
      try {
        await adapter.remove(idToRemove);
        toast.success("試合を削除しました。");
      } catch (e) {
        console.error("[useFirestore] remove failed:", e);
        // rules が所有者以外の削除を弾いた場合は理由を明示する（UI は本来
        // 自分の行にしか削除ボタンを出さないが、競合等の保険として残す）。
        // firebase/firestore を import せず code を duck-typing で判定する。
        const code = (e as { code?: unknown })?.code;
        toast.error(
          code === "permission-denied"
            ? "自分が登録した試合のみ削除できます。"
            : "削除に失敗しました。",
        );
      }
    },
    [adapter],
  );

  const addBatch = useCallback(
    async (itemsWithoutId: Omit<T, "id">[]) => {
      if (itemsWithoutId.length === 0) {
        toast.info("登録するデータがありません。");
        return;
      }
      try {
        await adapter.addBatch(itemsWithoutId);
        toast.success(`${itemsWithoutId.length}件の試合を一括登録しました。`);
      } catch (e) {
        console.error("[useFirestore] addBatch failed:", e);
        toast.error("一括登録に失敗しました。");
      }
    },
    [adapter],
  );

  // ローカルキャッシュを明示的に読み戻す（手動同期）
  const reloadLocal = useCallback(() => {
    setItems(readLocal<T>(localKey));
    toast.info("ローカルキャッシュを再読込しました。");
  }, [localKey]);

  // ローカルキャッシュをすべてクリア
  const clearLocal = useCallback(() => {
    if (!confirm("本当にローカルキャッシュをすべて削除しますか？")) return;
    setItems([]);
    localStorage.removeItem(localKey);
    toast.success("ローカルキャッシュをクリアしました。");
  }, [localKey]);

  return {
    mode,
    items,
    add,
    remove,
    addBatch,
    reloadLocal,
    clearLocal,
  };
}
