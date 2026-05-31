import type { WithId } from "./types";

/**
 * id が string でない場合はデータ破損とみなし、新規 UUID を付与して整合性を確保する。
 * 元オブジェクトは破壊せず、新しいオブジェクトとして返す。
 */
export function normalizeId<T extends WithId>(x: T): T {
  const normalizedId = typeof x.id === "string" ? x.id : crypto.randomUUID();
  return { ...x, id: normalizedId } as T;
}

/** createdAt の降順（新しい順）でソートした新しい配列を返す。 */
export function sortByCreatedAtDesc<T extends WithId>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

/** localStorage が使える環境か（node/SSR/エミュレータ統合テストでは存在しない）。 */
const hasLocalStorage = (): boolean => typeof localStorage !== "undefined";

/**
 * localStorage から読み出し、id を正規化して createdAt 降順で返す。
 * 破損・未設定時、または localStorage が無い環境では空配列（例外は投げない）。
 * LocalAdapter とリモートのキャッシュ読みで共用。
 */
export function readLocal<T extends WithId>(key: string): T[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByCreatedAtDesc((parsed as T[]).map((x) => normalizeId(x)));
  } catch (e) {
    console.error("[storage] readLocal failed:", e);
    return [];
  }
}

/**
 * createdAt 降順に整列して localStorage へ保存する。
 * localStorage が無い環境（node/SSR 等）では no-op（キャッシュは最適化なので無くても動作する）。
 */
export function writeLocal<T extends WithId>(key: string, items: T[]): void {
  if (!hasLocalStorage()) return;
  localStorage.setItem(key, JSON.stringify(sortByCreatedAtDesc(items)));
}
