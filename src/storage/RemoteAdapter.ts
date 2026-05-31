import {
  addDoc,
  type CollectionReference,
  collection,
  type DocumentData,
  deleteDoc,
  doc,
  type Firestore,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  writeBatch,
} from "firebase/firestore";
import { readLocal, writeLocal } from "./helpers";
import type { StorageAdapter, WithId } from "./types";

/**
 * Firestore を裏に持つストレージアダプタ。
 *
 * - 書き込み（add/addBatch/remove）は楽観更新を手書きしない。Firestore の
 *   latency compensation により `onSnapshot` がローカルキャッシュから即時発火するため、
 *   購読を唯一の正本（source of truth）として扱う（#48 ②）。
 * - `onSnapshot` で受けた全件は localStorage にミラー（キャッシュ）し、
 *   購読開始時の即時描画と、同期失敗時のフォールバック表示に使う。
 */
export class RemoteAdapter<T extends WithId> implements StorageAdapter<T> {
  private readonly db: Firestore;
  private readonly cacheKey: string;
  private readonly colRef: CollectionReference<DocumentData>;

  constructor(db: Firestore, collectionName: string) {
    this.db = db;
    this.cacheKey = collectionName;
    this.colRef = collection(db, collectionName);
  }

  subscribe(
    listener: (items: T[]) => void,
    onError?: (error: unknown) => void,
  ): () => void {
    // 初回はキャッシュで即時描画（onSnapshot 到達までの空白を埋める）
    const cached = readLocal<T>(this.cacheKey);
    if (cached.length > 0) listener(cached);

    return onSnapshot(
      this.colRef,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => {
          const data = d.data();
          // Firestore の createdAt は Timestamp の場合があるので number に正規化
          let createdAt = data.createdAt;
          if (
            createdAt &&
            typeof createdAt === "object" &&
            "toMillis" in createdAt
          ) {
            createdAt = (createdAt as Timestamp).toMillis();
          }
          return { ...data, id: d.id, createdAt };
        }) as T[];

        writeLocal(this.cacheKey, loaded); // キャッシュ更新
        listener(loaded);
      },
      (error) => {
        console.error("[RemoteAdapter] onSnapshot failed:", error);
        // 同期失敗時はローカルキャッシュを表示
        listener(readLocal<T>(this.cacheKey));
        onError?.(error);
      },
    );
  }

  async add(item: Omit<T, "id" | "createdAt">): Promise<void> {
    // id は Firestore の自動採番に任せ、createdAt はサーバ時刻
    await addDoc(this.colRef, {
      ...item,
      createdAt: serverTimestamp(),
    } as DocumentData);
  }

  async addBatch(items: Omit<T, "id">[]): Promise<void> {
    if (items.length === 0) return;
    const batch = writeBatch(this.db);
    for (const item of items) {
      const ref = doc(this.colRef); // 自動 ID
      batch.set(ref, {
        ...item,
        createdAt:
          "createdAt" in item && typeof item.createdAt === "number"
            ? item.createdAt
            : Date.now(),
      } as DocumentData);
    }
    await batch.commit();
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.db, this.cacheKey, id));
  }
}
