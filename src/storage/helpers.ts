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

/**
 * localStorage から読み出し、id を正規化して createdAt 降順で返す。
 * 破損・未設定時は空配列（例外は投げない）。LocalAdapter とリモートのキャッシュ読みで共用。
 */
export function readLocal<T extends WithId>(key: string): T[] {
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

/** createdAt 降順に整列して localStorage へ保存する。 */
export function writeLocal<T extends WithId>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(sortByCreatedAtDesc(items)));
}
