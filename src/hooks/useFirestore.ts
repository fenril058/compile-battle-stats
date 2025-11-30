import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from 'react-toastify';
import { db } from "../firebase";
import type { StorageMode } from "../types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  writeBatch,
  type DocumentData,
  onSnapshot,
} from "firebase/firestore";

/**
 * T は { id: string, createdAt: number } を継承
 */
type WithId = { id: string; createdAt: number };

// IDがstringでない場合は、データ破損とみなし新規UUIDを付与して整合性を確保する
function normalizeId<T extends WithId | { id?: any }>(x: T): T {
  const id = typeof x.id === "string" ? x.id : crypto.randomUUID();
  return { ...x, id } as T;
}

// ローカルストレージを直接操作するヘルパー関数
// ★修正: T の型を WithId に限定。これにより createdAt の存在が保証される。
const updateLocalCache = <T extends WithId>(key: string, items: T[]): void => {
  // createdAtでソートして保存
  // RemoteからのデータはFirestoreのCreatedAtでソートされるべきだが、ここではローカルのcreatedAtを使用
  // b.createdAt - a.createdAt で安全にソート可能
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  localStorage.setItem(key, JSON.stringify(sorted));
};


export function useFirestore<T extends WithId>(
  collectionName: string,
) {
  const localKey = collectionName;
  const [items, setItems] = useState<T[]>([]);
  const mode: StorageMode = db ? "remote" : "local";
  const colRef = useMemo(() => (db ? collection(db, collectionName) : null), [db, collectionName]);

  // loadRemoteをuseCallbackで定義 (onSnapshotのリスナーとして使用)
  const loadRemote = useCallback(async () => {
    if (!db || !colRef) return;

    // onSnapshotでリアルタイム更新を購読
    return onSnapshot(colRef, (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id, // FirestoreのドキュメントIDをidとして採用
        })) as T[];

        // キャッシュとしてローカルストレージも更新
        updateLocalCache(localKey, loaded);
        setItems(loaded);
    }, (error) => {
        console.error("[useFirestore] Remote loading failed (onSnapshot):", error);
        toast.error("リモートデータの同期に失敗しました。ローカルキャッシュを表示します。");
        // エラー発生時はローカルキャッシュを読み込む (reloadLocalのロジックを再利用)
        reloadLocal();
    });
  }, [colRef, localKey]);


  // 初回ロード：ローカルストレージ（キャッシュ）の読み込み
  useEffect(() => {
    // 常にまずローカルキャッシュから読み込む
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // normalizeIdでIDの整合性をチェックしながらStateに設定
          setItems((parsed as T[]).map((x) => normalizeId(x)));
        }
      } catch (e) {
        console.error("[useFirestore] initial load failed:", e);
      }
    }

    let unsubscribe: (() => void) | undefined;
    if (mode === "remote") {
      // Remoteモードの場合、リモートから読み込みを開始 (onSnapshot)
      loadRemote().then(unsub => {
          unsubscribe = unsub;
      });
    }

    return () => {
      // Remoteモード終了時に onSnapshot を解除
      if (unsubscribe) unsubscribe();
    };
  }, [localKey, mode, loadRemote]);


  const add = useCallback(
    async (
      itemWithoutMeta: Omit<T, "id" | "createdAt">
    ) => {
      // データの完全な形を生成 (一時的なIDを付与)
      const newItem = {
        ...itemWithoutMeta,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      } as T;

      // 1. Local StorageとStateを即座に更新 (キャッシュとして)
      setItems((prev) => {
        const updated = [...prev, newItem];
        updateLocalCache(localKey, updated); // LocalStorageも更新
        return updated;
      });
      toast.success("試合を追加しました。"); // 即座に成功を通知

      if (mode === "remote" && db && colRef) {
        // 2. Firestoreへの保存 (非同期)
        try {
          // Firestoreに保存する際は id フィールドを含めない
          const { id, ...rest } = newItem;
          await addDoc(colRef, rest as DocumentData);
        } catch (e) {
          console.error("[useFirestore] remote add failed. Data is only in local cache:", e);
          toast.error("リモートへの登録に失敗しました。ローカルキャッシュにのみ保存されました。");
        }
      }
    },
    [colRef, mode, localKey]
  );

  const remove = useCallback(
    async (idToRemove: string) => {
      if (!confirm("本当にこの試合を削除しますか？")) return;

      // 1. Local StorageとStateを即座に更新
      let removedItem: T | undefined;
      setItems((prev) => {
        const updated = prev.filter((item) => {
            const normalizedId = normalizeId(item).id;
            const match = normalizedId === idToRemove;
            if (match) removedItem = item;
            return !match;
        });
        updateLocalCache(localKey, updated); // LocalStorageも更新
        return updated;
      });
      toast.success("試合を削除しました。");

      if (mode === "remote" && db && colRef && removedItem) {
        // 2. Firestoreからの削除 (非同期)
        try {
          const docRef = doc(db, collectionName, idToRemove);
          await deleteDoc(docRef);
        } catch (e) {
          console.error("[useFirestore] remote remove failed. Local cache cleaned, but remote item might remain:", e);
          toast.error("リモートからの削除に失敗しました。手動で削除する必要があるかもしれません。");
        }
      }
    },
    [colRef, mode, localKey]
  );

  // ★追加: 複数の試合データを一括登録するためのバッチ処理
  const addBatch = useCallback(
    async (itemsWithoutMeta: Omit<T, "id" | "createdAt">[]) => {
      if (!db || !colRef || itemsWithoutMeta.length === 0) {
        toast.info("登録するデータがありません。");
        return;
      }

      const batch = writeBatch(db);

      for (const item of itemsWithoutMeta) {
          const ref = doc(colRef); // Firestore auto-IDを生成
          const itemWithTimestamp = {
              ...item,
              timestamp: Date.now(),
          };
          // Document IDはFirestoreが自動で生成するため、データに id フィールドは含めない
          batch.set(ref, itemWithTimestamp as DocumentData);
      }

      try {
          await batch.commit();
          toast.success(`${itemsWithoutMeta.length}件の試合を一括登録しました。`);
          // onSnapshotでリアルタイムにStateが更新されるため、setItemsは不要
      } catch (e) {
          console.error("[useFirestore] remote batch add failed:", e);
          toast.error("リモートへの一括登録に失敗しました。");
      }
    }, [colRef]
  );


  // ローカル全件をリモートへバッチ投入 → その後リモート再読込
  const pushAllLocalToRemote = useCallback(async () => {
    if (!db || !colRef || items.length === 0) return;
    const batch = writeBatch(db);
    for (const item of items) {
      // id は Firestore に保存しなくても良い（重複防止のためフィールドとして残さない運用推奨）
      const ref = doc(colRef); // 自動ID
      const { id, ...rest } = item;
      batch.set(ref, rest as DocumentData);
    }
    await batch.commit();
    await loadRemote();
    toast.success("ローカルデータをリモートに移行しました。");
  }, [items, colRef, loadRemote]);

  // ローカルのキャッシュを明示的に読み戻す（Localモード用の“手動同期”）
  const reloadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) {
        setItems([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems((parsed as T[]).map((x) => normalizeId(x)));
      }
      toast.info("ローカルキャッシュを再読込しました。");
    } catch (e) {
      console.error("[useFirestore] reloadLocal failed:", e);
      toast.warn("ローカルデータの読込に失敗しました");
    }
  }, [localKey]);

  // すべてクリア（ローカルだけ）
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
    addBatch, // ★追加: 一括追加関数を公開
    pushAllLocalToRemote,
    reloadLocal,
    clearLocal,
    loadRemote,
  };
};
