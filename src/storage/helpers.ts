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
