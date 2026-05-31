import { normalizeId, readLocal, writeLocal } from "./helpers";
import type { StorageAdapter, WithId } from "./types";

/**
 * localStorage を裏に持つストレージアダプタ。
 *
 * Firebase 非依存・即時反映。本番運用では使わないが、
 * - dev / デモ用の login 不要ハーネス
 * - データ層の契約テスト（jsdom で完結）
 * の両方を担う（#48 B 案）。
 */
export class LocalAdapter<T extends WithId> implements StorageAdapter<T> {
  private readonly listeners = new Set<(items: T[]) => void>();
  private readonly key: string;

  constructor(key: string) {
    this.key = key;
  }

  private read(): T[] {
    return readLocal<T>(this.key);
  }

  private write(items: T[]): void {
    writeLocal<T>(this.key, items);
  }

  /** 現在の全件を購読者へ通知する。 */
  private emit(): void {
    const items = this.read();
    for (const listener of this.listeners) listener(items);
  }

  subscribe(listener: (items: T[]) => void): () => void {
    this.listeners.add(listener);
    // 登録直後に現在値で一度発火（契約）
    listener(this.read());
    return () => {
      this.listeners.delete(listener);
    };
  }

  async add(item: Omit<T, "id" | "createdAt">): Promise<void> {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    } as T;
    this.write([...this.read(), newItem]);
    this.emit();
  }

  async addBatch(items: Omit<T, "id">[]): Promise<void> {
    if (items.length === 0) return;
    const created = items.map(
      (it) =>
        ({
          ...it,
          id: crypto.randomUUID(),
          createdAt:
            "createdAt" in it && typeof it.createdAt === "number"
              ? it.createdAt
              : Date.now(),
        }) as T,
    );
    this.write([...this.read(), ...created]);
    this.emit();
  }

  async remove(id: string): Promise<void> {
    const next = this.read().filter((x) => normalizeId(x).id !== id);
    this.write(next);
    this.emit();
  }
}
