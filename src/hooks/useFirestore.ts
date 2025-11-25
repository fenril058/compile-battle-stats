// src/hooks/useFirestore.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from 'react-toastify';
import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type DocumentData,
  onSnapshot,
} from "firebase/firestore";

/**
 * T は { id?: string } を含む前提（追加時に id を付与）
 */
type WithId = { id?: string };

export type StorageMode = "remote" | "local";


// 旧データ互換のため id を文字列に正規化
function normalizeId<T extends WithId>(x: T): T {
  const id =
    typeof x.id === "string"
      ? x.id
      : x.id != null
      ? String(x.id)
      : undefined;
  return { ...x, id };
}

export function useFirestore<T extends WithId>(
  collectionName: string,
  localKey: string
) {
  const [items, setItems] = useState<T[]>([]);
  const mode: StorageMode = db ? "remote" : "local";
  const colRef = useMemo(() => (db ? collection(db, collectionName) : null), [db, collectionName]);

  // 初回ロード：localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems((parsed as T[]).map((x) => normalizeId(x)));
        }
      }
    } catch (e) {
      console.error("[useFirestore] Initial load failed:", e);
    }
  }, [localKey]);

  // リアルタイム購読：Remote時はサーバー正で items を維持（複数人操作のズレを最小化）
  useEffect(() => {
    if (!db || !colRef) return;
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const loaded = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
      setItems(loaded);
    });
    return unsubscribe;
  }, [db, colRef]);

  // items の変更を検知して LocalStorage へ自動で保存する
  useEffect(() => {
    if (mode === 'local' && items.length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(items));
      } catch (e) {
        console.error("[useFirestore] Autosave to localStorage failed:", e);
        // 保存失敗時はユーザーに通知する
        toast.error("ローカルストレージへの自動保存に失敗しました。");
      }
    }
  }, [items, localKey, mode]); // items が変更されるたびに実行

  // 追加
  const add = useCallback(
    async (data: Omit<T, "id" | "timestamp">) => {
      const dataWithTimestamp = { ...data, timestamp: Date.now() };

      if (mode === "remote" && colRef) {
        const docRef = await addDoc(colRef, dataWithTimestamp as DocumentData);
        toast.success(`追加しました: id=${docRef.id}`);
        // ✅ Remoteでは onSnapshot に任せる（ここでは setItems しない）
        //    → スナップショット到着時に docRef.id を含むサーバー正で全置換される
      } else {
        const id = crypto.randomUUID();
        setItems((prev) => [...prev, { ...(dataWithTimestamp as unknown as T), id }]);
      }
    },
    [mode, colRef]
  );

  // 削除（悲観的更新：成功後にUI反映）
  const remove = useCallback(
    async (id: string) => {
      const idStr = String(id);
      try {
        if (mode === "remote") {
          if (!db || !colRef) throw new Error("Firestore not initialized.");
          // Firestore ドキュメント削除（成功を確認してからUI反映）
          await deleteDoc(doc(db, collectionName, idStr));

          // 成功したのでUIから消す
          setItems((prev) => prev.filter((x) => String(x.id) !== idStr));

          // サーバーを正として再同期（任意だが今回の事象確認に有効）
          try {
            const snap = await getDocs(colRef);
            const loaded = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
            setItems(loaded);
          } catch {
            /* noop */
          }
        } else {
          // local モード：UIから消すだけ（localStorage は useEffect で同期）
          setItems((prev) => prev.filter((x) => String(x.id) !== idStr));
        }
      } catch (err) {
        console.error("[useFirestore] remove failed:", err);
        alert("削除に失敗しました。通信状況または権限を確認してください。");
      }
    },
    [mode, collectionName, colRef]
  );

  // リモートを正にするロード
  const loadRemote = useCallback(async () => {
    if (!db || !colRef) return;
    const snap = await getDocs(colRef);
    const loaded = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
    setItems(loaded);
  }, [colRef]);

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
  }, [items, colRef, loadRemote]);



  // ★ ローカルのキャッシュを明示的に読み戻す（Localモード用の“手動同期”）
  const reloadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems((parsed as T[]).map((x) => normalizeId(x)));
      }
    } catch (e) {
      console.error("[useFirestore] reloadLocal failed:", e);
      alert("ローカルデータの読込に失敗しました");
    }
  }, [localKey]);

  // すべてクリア（ローカルだけ）
  const clearLocal = useCallback(() => {
    setItems([]);
    localStorage.removeItem(localKey);
  }, [localKey]);

  return {
    mode,                // 'remote' | 'local'
    items,               // T[]
    add,                 // (data: Omit<T, 'id'>) => Promise<void>
    remove,              // (id: string) => Promise<void>
    loadRemote,          // () => Promise<void>
    pushAllLocalToRemote,// () => Promise<void>
    reloadLocal,         // () => void
    clearLocal,          // () => void
  };
}
