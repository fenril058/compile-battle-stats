/**
 * ストレージ層の共通契約。
 *
 * `RemoteAdapter`（Firestore）と `LocalAdapter`（localStorage）が同一契約を満たすことで、
 * データ層を Firebase 非依存で契約テストできるようにする（#48 B 案）。
 */

/** すべての保存データが満たす最小形。`createdAt` でソートできることを保証する。 */
export type WithId = { id: string; createdAt: number };

export interface StorageAdapter<T extends WithId> {
  /**
   * 変更を購読する。登録直後に必ず現在の全件で `listener` を一度呼び、以降は変更のたびに呼ぶ。
   * @returns 購読解除関数
   */
  subscribe(
    listener: (items: T[]) => void,
    onError?: (error: unknown) => void,
  ): () => void;

  /** 1 件追加（id / createdAt はアダプタ側で付与）。 */
  add(item: Omit<T, "id" | "createdAt">): Promise<void>;

  /** 複数件を一括追加。`createdAt` が数値で含まれていればそれを使い、無ければ現在時刻。 */
  addBatch(items: Omit<T, "id">[]): Promise<void>;

  /** id 指定で 1 件削除。 */
  remove(id: string): Promise<void>;
}
