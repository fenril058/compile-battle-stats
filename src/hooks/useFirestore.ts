import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useT } from "../i18n";
import { getFirebase, isFirebaseEnabled } from "../storage/firebase";
import { readLocal } from "../storage/helpers";
import { LocalAdapter } from "../storage/LocalAdapter";
import type { StorageAdapter, WithId } from "../storage/types";
import type { StorageMode } from "../types";

/**
 * データアクセス層。ストレージの実体（Firestore / localStorage）は `StorageAdapter`
 * に隠蔽し、このフックは「購読 → state 反映」「操作 → トースト通知」だけを担う。
 *
 * firebase/firestore は直接 import しない。remote の実体（RemoteAdapter）は
 * firebase/firestore を静的 import しているため、それを静的に取り込むと local
 * モードでも firebase チャンクが初回ロードされてしまう。よって remote のときだけ
 * `getFirebase()` 解決後に RemoteAdapter を動的 import して生成する。
 */
export function useFirestore<T extends WithId>(collectionName: string) {
  const localKey = collectionName;
  const [items, setItems] = useState<T[]>([]);
  const mode: StorageMode = isFirebaseEnabled ? "remote" : "local";
  const { t } = useT();

  // アダプタは Promise として保持する。remote では firebase の初期化と
  // RemoteAdapter モジュールの動的 import を待つ必要があるため。
  // collectionName が変わらない限り同一 Promise（＝同一インスタンス）。
  // init 失敗で LocalAdapter にフォールバックしたら一度だけ同期失敗を通知したい。
  // memo 内で t を使うと言語切替で再購読が走るため、フラグだけ立てて effect で通知する。
  const [initFailed, setInitFailed] = useState(false);

  const adapterPromise = useMemo<Promise<StorageAdapter<T>>>(
    () =>
      isFirebaseEnabled
        ? getFirebase().then(async (fb) => {
            if (!fb) {
              // init 失敗時は LocalAdapter にフォールバックする。
              setInitFailed(true);
              return new LocalAdapter<T>(collectionName);
            }
            const { RemoteAdapter } = await import("../storage/RemoteAdapter");
            return new RemoteAdapter<T>(fb.db, collectionName);
          })
        : Promise.resolve(new LocalAdapter<T>(collectionName)),
    [collectionName],
  );

  // init 失敗のフォールバック通知（一度だけ）
  useEffect(() => {
    if (initFailed) toast.error(t("storage.toast.syncFailed"));
  }, [initFailed, t]);

  // 購読：アダプタが現在値（および以降の変更）を push し、state へ反映する。
  // adapterPromise の解決を待つ間、RemoteAdapter.subscribe は cache-first なので
  // 実用上の空白は短いが、念のため effect 冒頭でローカルキャッシュを即時反映する。
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    setItems(readLocal<T>(localKey));

    adapterPromise.then((adapter) => {
      if (cancelled) return;
      unsubscribe = adapter.subscribe(
        (next) => setItems(next),
        () => {
          toast.error(t("storage.toast.syncFailed"));
        },
      );
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [adapterPromise, localKey, t]);

  const add = useCallback(
    async (item: Omit<T, "id" | "createdAt">) => {
      try {
        await (await adapterPromise).add(item);
        toast.success(t("storage.toast.added"));
      } catch (e) {
        console.error("[useFirestore] add failed:", e);
        toast.error(t("storage.toast.addFailed"));
      }
    },
    [adapterPromise, t],
  );

  const remove = useCallback(
    async (idToRemove: string) => {
      try {
        await (await adapterPromise).remove(idToRemove);
        toast.success(t("storage.toast.removed"));
      } catch (e) {
        console.error("[useFirestore] remove failed:", e);
        // rules が所有者以外の削除を弾いた場合は理由を明示する（UI は本来
        // 自分の行にしか削除ボタンを出さないが、競合等の保険として残す）。
        // firebase/firestore を import せず code を duck-typing で判定する。
        const code = (e as { code?: unknown })?.code;
        toast.error(
          code === "permission-denied"
            ? t("storage.toast.removeDeniedOwnerOnly")
            : t("storage.toast.removeFailed"),
        );
      }
    },
    [adapterPromise, t],
  );

  const addBatch = useCallback(
    async (itemsWithoutId: Omit<T, "id">[]) => {
      if (itemsWithoutId.length === 0) {
        toast.info(t("storage.toast.batchEmpty"));
        return;
      }
      try {
        await (await adapterPromise).addBatch(itemsWithoutId);
        toast.success(
          t("storage.toast.batchAdded", { count: itemsWithoutId.length }),
        );
      } catch (e) {
        console.error("[useFirestore] addBatch failed:", e);
        toast.error(t("storage.toast.batchFailed"));
      }
    },
    [adapterPromise, t],
  );

  // ローカルキャッシュを明示的に読み戻す（手動同期）
  const reloadLocal = useCallback(() => {
    setItems(readLocal<T>(localKey));
    toast.info(t("storage.toast.reloadedLocal"));
  }, [localKey, t]);

  // ローカルキャッシュをすべてクリア
  const clearLocal = useCallback(() => {
    if (!confirm(t("storage.confirm.clearLocal"))) return;
    setItems([]);
    localStorage.removeItem(localKey);
    toast.success(t("storage.toast.clearedLocal"));
  }, [localKey, t]);

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
