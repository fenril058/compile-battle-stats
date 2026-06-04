import {
  ALL_PROTOCOLS,
  MIN_GAMES_FOR_MATRIX,
  MIN_GAMES_FOR_PAIR_STATS,
} from "../config";
import type {
  Match,
  MatrixData,
  Protocol,
  Ratios,
  SideStats,
  StatEntry,
  StatRow,
  StatsResult,
  Trio,
} from "../types";
import { parseCalendarDate } from "./date";

// ratios を引数で受け取る
export const ratioSum = (t: Trio, ratios: Ratios): number =>
  t.reduce((a, p) => a + (ratios[p] ?? 0), 0);

// ratios と maxRatio(閾値) と ratioProtocols(レシオ対象プロトコル) を受け取る
export const isRatioBattle = (
  a: Trio,
  b: Trio,
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
): boolean => {
  const allEligible = (t: Trio) => t.every((p) => ratioProtocols.includes(p));
  if (!allEligible(a) || !allEligible(b)) return false;
  return ratioSum(a, ratios) <= maxRatio && ratioSum(b, ratios) <= maxRatio;
};

export const percent = (w: number, g: number): number =>
  g ? Math.round((w / g) * 1000) / 10 : 0;

export type WinRateCI = { p: number; low: number; high: number };

/**
 * Wilson score interval を用いた勝率の信頼区間を計算する。
 * @param w 勝ち数
 * @param g 試合数
 * @param z 標準正規分位点（既定 1.96 ≒ 95%）
 * @returns p: 点推定値（percentと同じ計算、0..100スケール小数第1位）
 *          low: 信頼区間下限（0..100スケール小数第1位）
 *          high: 信頼区間上限（0..100スケール小数第1位）
 */
export const wilsonInterval = (w: number, g: number, z = 1.96): WinRateCI => {
  // 試合数が0の場合は0..100スケールで {p:0, low:0, high:0}を返す
  if (g === 0) {
    return { p: 0, low: 0, high: 0 };
  }

  // 点推定値（0..1スケール）
  const phat = w / g;

  // Wilson score interval の計算（0..1スケール）
  const z2 = z * z;
  const denominator = 1 + z2 / g;
  const center = (phat + z2 / (2 * g)) / denominator;
  const marginNumerator =
    z * Math.sqrt((phat * (1 - phat)) / g + z2 / (4 * g * g));
  const margin = marginNumerator / denominator;

  // 信頼区間（0..1スケール）
  const lowRatio = center - margin;
  const highRatio = center + margin;

  // 0..100スケールに変換して小数第1位に丸める
  const p = percent(w, g);
  const low = Math.max(0, Math.round(lowRatio * 1000) / 10);
  const high = Math.min(100, Math.round(highRatio * 1000) / 10);

  return { p, low, high };
};

/**
 * 統計集計の対象となる「妥当なトリオ」かを判定する。
 * 長さが 3 で、チーム内にプロトコルの重複が無いこと。
 * makeStats（単体/ペア/トリオ/先後）と countMatchups（相性表）の双方で共有し、
 * 「不正な試合」の定義が両者で食い違わないようにする。
 */
export const isValidTrio = (trio: Trio): boolean => {
  // 1. 長さが3であること
  if (trio.length !== 3) return false;
  // 2. 重複がないこと
  if (new Set(trio).size !== 3) return false;
  return true;
};

export const makeStats = (list: Match[]): StatsResult => {
  // 初期化
  const s: StatsResult = {
    single: {},
    pair: {},
    trio: {},
    first: {},
    second: {},
  };

  const bump = (m: SideStats, k: string, w: boolean) => {
    if (!m[k]) m[k] = { g: 0, w: 0 };
    m[k].g += 1;
    if (w) m[k].w += 1;
  };

  for (const mt of list) {
    const firstValid = isValidTrio(mt.first);
    const secondValid = isValidTrio(mt.second);

    // どちらかのチーム構成が不正なら、この試合全体を統計から除外する
    if (!firstValid || !secondValid) {
      // 開発者向けにログを出力
      console.warn(`Skipping invalid match ID: ${mt.id}.
      Reason: Invalid Trio structure (Duplicated/Incorrect length protocols).`);
      continue;
    }

    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";

    const sides = [
      { t: mt.first, w: firstWin, first: true },
      { t: mt.second, w: secondWin, first: false },
    ];

    for (const side of sides) {
      // Single
      side.t.forEach((p) => {
        bump(s.single, p, side.w);
      });

      // Pair
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          const key = [side.t[i], side.t[j]].sort().join(" · ");
          bump(s.pair, key, side.w);
        }
      }

      // Trio
      const trioKey = [...side.t].sort().join(" · ");
      bump(s.trio, trioKey, side.w);

      // First/Second
      side.t.forEach((p) => {
        bump(side.first ? s.first : s.second, p, side.w);
      });
    }
  }

  return s;
};

/**
 * SideStats から StatRow[] への変換
 * @param stats - makeStatsで生成された統計結果の一部分 (SideStats)
 * @param key - どの統計項目か (single, pair, trio, first, second)
 * @param minPair - ペアの最小試合数 (configから取得)
 * @param minTrio - トリオの最小試合数 (configから取得)
 * @returns ソート・整形された StatRow の配列
 */
export const rows = (
  stats: SideStats,
  key: keyof StatsResult,
  minPair: number,
  minTrio: number,
): StatRow[] => {
  // ← 戻り値の型を StatRow[] に指定
  const data: StatRow[] = Object.entries(stats) // ★ data の型を StatRow[] で明示
    .map(([n, { g, w }]) => {
      const ci = wilsonInterval(w, g);
      return {
        n,
        g,
        w,
        l: g - w,
        p: ci.p,
        low: ci.low,
        high: ci.high,
      };
    })
    .filter((v) => {
      // 最小試合数に満たないデータを除外するフィルター
      if (key === "pair" && v.g < minPair) return false;
      if (key === "trio" && v.g < minTrio) return false;
      return true;
    })
    .sort((a, b) => b.p - a.p);

  return data;
};

// 有向ペア (a__b) ごとの対戦数/勝利数を集計する内部ヘルパー。
// matchup（行列表現）と matchupPairs（リスト表現）で共有する。
const countMatchups = (list: Match[]): Record<string, StatEntry> => {
  const r: Record<string, StatEntry> = {};
  const bump = (k: string, w: boolean) => {
    if (!r[k]) r[k] = { g: 0, w: 0 };
    r[k].g += 1;
    if (w) r[k].w += 1;
  };

  for (const mt of list) {
    // makeStats と同じ妥当性判定で不正な試合（チーム内重複など）を除外し、
    // 相性表と各統計で「不正な試合」の扱いを揃える（#67）。
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;

    const firstWin = mt.winner === "FIRST";
    const secondWin = mt.winner === "SECOND";

    for (const lp of mt.first) {
      for (const rp of mt.second) {
        bump(`${lp}__${rp}`, firstWin);
        bump(`${rp}__${lp}`, secondWin);
      }
    }
  }

  return r;
};

export const matchup = (
  list: Match[],
  protocols: readonly Protocol[] = ALL_PROTOCOLS,
) => {
  const r = countMatchups(list);

  const m: MatrixData = {};
  for (const a of protocols) {
    m[a] = {};
    for (const b of protocols) {
      m[a][b] = null;
    }
  }
  for (const [k, v] of Object.entries(r)) {
    const [aStr, bStr] = k.split("__");
    const a = aStr as Protocol;
    const b = bStr as Protocol;
    if (m[a] && v.g >= MIN_GAMES_FOR_MATRIX) {
      m[a][b] = percent(v.w, v.g);
    }
  }

  return m;
};

// 相性表（行列）の別表現。MIN_GAMES_FOR_MATRIX 以上戦った有向ペアだけを
// リスト化して返す。疎な相性表（全試合 30×30 など）で巨大な空セルを描かずに済む。
// 戦数降順 → 勝率降順でソート。
export type MatchupPair = {
  a: Protocol;
  b: Protocol;
  g: number;
  w: number;
  l: number;
  p: number;
};

export const matchupPairs = (list: Match[]): MatchupPair[] => {
  const r = countMatchups(list);

  const pairs: MatchupPair[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (v.g < MIN_GAMES_FOR_MATRIX) continue;
    const [aStr, bStr] = k.split("__");
    pairs.push({
      a: aStr as Protocol,
      b: bStr as Protocol,
      g: v.g,
      w: v.w,
      l: v.g - v.w,
      p: percent(v.w, v.g),
    });
  }

  pairs.sort((x, y) => (y.g !== x.g ? y.g - x.g : y.p - x.p));
  return pairs;
};

export type QuadrantPoint = {
  n: string; // プロトコル名
  g: number; // 出現スロット数
  w: number;
  p: number; // 勝率 (0..100)
  pickRate: number; // ピック率 (0..100)
};

/**
 * SideStats からクアドラント散布図用のデータ点を生成する。
 * @param single - makeStats().single 等の SideStats
 * @param minGames - この数未満の試合数を持つ点は除外（既定 1）
 * @returns pickRate 降順（同率は p 降順）でソートされた QuadrantPoint[]
 */
export const quadrantPoints = (
  single: SideStats,
  minGames = 1,
): QuadrantPoint[] => {
  const entries = Object.entries(single);
  const totalG = entries.reduce((acc, [, { g }]) => acc + g, 0);

  if (totalG === 0) return [];

  return entries
    .filter(([, { g }]) => g >= minGames)
    .map(([n, { g, w }]) => ({
      n,
      g,
      w,
      p: percent(w, g),
      pickRate: Math.round((g / totalG) * 1000) / 10,
    }))
    .sort((a, b) => b.pickRate - a.pickRate || b.p - a.p);
};

// --- Usage Timeline (週別ピック率の時系列) -----------------------------------

export type UsageBucket = { label: string; start: number };
export type UsageSeries = { protocol: string; points: number[] }; // 各 bucket のピック率(0..100)
export type UsageTimeline = { buckets: UsageBucket[]; series: UsageSeries[] };

/**
 * matchDate 付き有効試合を週単位のバケットに分割し、各プロトコルのピック率時系列を返す。
 *
 * バケットの週頭は「月曜 00:00 UTC」に統一する。
 * 理由: ISO 8601 では週は月曜始まりが標準で、UTC で計算が完結し TZ の影響を受けない。
 * 日曜始まりより国際的に一般的で、チームゲームの集計単位として自然。
 *
 * @param matches - 全試合一覧
 * @param options - topN: 個別 series にする上位プロトコル数（既定 6）
 */
export const usageTimeline = (
  matches: Match[],
  options?: { topN?: number },
): UsageTimeline => {
  const topN = options?.topN ?? 6;

  // 有効試合かつ matchDate が数値のものだけ対象
  const valid = matches.filter(
    (m) =>
      typeof m.matchDate === "number" &&
      isValidTrio(m.first) &&
      isValidTrio(m.second),
  );

  if (valid.length === 0) return { buckets: [], series: [] };

  /**
   * UTC ms → その週の月曜 00:00 UTC (ms) に切り下げる。
   * UTC で dayOfWeek を取得し、月曜=1 を基点に差を引いて真夜中へ。
   */
  const toWeekStart = (ms: number): number => {
    const d = new Date(ms);
    // getUTCDay(): 0=Sun, 1=Mon, ... 6=Sat
    // 月曜を 0 とするオフセット: Mon=0, Tue=1, ..., Sun=6
    const offset = (d.getUTCDay() + 6) % 7;
    return Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - offset,
    );
  };

  // バケット start → { 各プロトコル出現数, 総スロット数 } のマップ
  const bucketMap = new Map<
    number,
    { slots: Map<string, number>; total: number }
  >();
  // プロトコル全期間総出現数
  const totalCount = new Map<string, number>();

  for (const m of valid) {
    const weekStart = toWeekStart(m.matchDate as number);
    if (!bucketMap.has(weekStart)) {
      bucketMap.set(weekStart, { slots: new Map(), total: 0 });
    }
    const bucket = bucketMap.get(weekStart) as {
      slots: Map<string, number>;
      total: number;
    };

    // first + second 両 trio の各プロトコル（makeStats と同じ数え方）
    for (const p of [...m.first, ...m.second]) {
      bucket.slots.set(p, (bucket.slots.get(p) ?? 0) + 1);
      bucket.total += 1;
      totalCount.set(p, (totalCount.get(p) ?? 0) + 1);
    }
  }

  // バケットを start 昇順でソート
  const sortedStarts = [...bucketMap.keys()].sort((a, b) => a - b);

  const buckets: UsageBucket[] = sortedStarts.map((start) => {
    const d = new Date(start);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return { label: `${y}-${mo}-${da}`, start };
  });

  // 全期間の総出現数で上位 topN プロトコルを決定（降順）。
  // 上位のみを系列化する。残りを束ねる「その他」系列は、値が大きく主役の
  // 折れ線を覆い隠して見づらくなるため作らない（#5）。
  const sortedByTotal = [...totalCount.entries()].sort((a, b) => b[1] - a[1]);
  const topProtocols = sortedByTotal.slice(0, topN).map(([p]) => p);

  // 各系列のポイント配列を構築
  const seriesMap = new Map<string, number[]>();
  for (const p of topProtocols) seriesMap.set(p, []);

  // 事前に各系列の points 配列への参照を取得し、ループ内でアクセスする。
  // seriesMap.get() が undefined にならないことはここまでのコードで保証済みだが、
  // 非 null アサーション (!.) を避けるため参照を変数に取り出す。
  const topSeriesPoints = topProtocols.map((p) => seriesMap.get(p) as number[]);

  for (const start of sortedStarts) {
    const b = bucketMap.get(start) as {
      slots: Map<string, number>;
      total: number;
    };
    const total = b.total;

    for (let i = 0; i < topProtocols.length; i += 1) {
      const count = b.slots.get(topProtocols[i] as string) ?? 0;
      topSeriesPoints[i]?.push(Math.round((count / total) * 1000) / 10);
    }
  }

  // series: 総使用率降順（上位 topN はすでに降順）
  const series: UsageSeries[] = topProtocols.map((p, i) => ({
    protocol: p,
    points: topSeriesPoints[i] ?? [],
  }));

  return { buckets, series };
};

export const parseMatchCsvRow = (
  row: string[],
  validProtocols: readonly Protocol[],
  ratios: Ratios,
  maxRatio: number,
  ratioProtocols: ReadonlyArray<string>,
): Omit<Match, "id" | "createdAt"> | null => {
  // 試合データとして最低限必要な7列 (F3  S3  Winner) があるか確認
  if (row.length < 7) return null;

  const upperRow = row.map((s) => s.trim().toUpperCase());
  const [F1, F2, F3, S1, S2, S3, W, DateStr] = upperRow;

  // 先に文字列のまま検証し、妥当性が確認できてから Protocol/Trio として扱う（#73）。
  const rawProtocols = [F1, F2, F3, S1, S2, S3];
  const validSet: ReadonlySet<string> = new Set(validProtocols);
  if (rawProtocols.some((p) => !validSet.has(p))) {
    return null;
  }

  // W は文字列。値で絞り込めば winner は Winner に絞られる（キャスト不要）。
  if (W !== "FIRST" && W !== "SECOND") return null;
  const winner = W;

  const firstTrio = [F1, F2, F3] as Trio;
  const secondTrio = [S1, S2, S3] as Trio;

  // 注入された ratios を使用して計算
  const ratio = isRatioBattle(
    firstTrio,
    secondTrio,
    ratios,
    maxRatio,
    ratioProtocols,
  );

  // 対戦日 (matchDate) のパース処理。
  // "2025/12/03" / "2025-12-03" などの暦日を UTC 真夜中として解釈する（#69）。
  // 空文字・不正な日付は null。
  const matchDate = parseCalendarDate(DateStr);

  return {
    first: firstTrio,
    second: secondTrio,
    winner: winner,
    ratio: ratio,
    matchDate: matchDate,
  };
};

// --- Bradley-Terry 型 強度推定 ---------------------------------------------

export type StrengthModel = {
  // プロトコル → 強度 (log-odds 寄与)。相方・相手を統制した「真の強さ」。
  theta: Record<string, number>;
  // 先攻補正 β（環境全体の先後有利を表す単一スカラー、log-odds）。
  firstAdvantage: number;
  // 学習に使った有効試合数（isValidTrio を通った試合）。
  games: number;
  iterations: number;
  converged: boolean;
};

export type StrengthModelOptions = {
  lambda?: number; // L2 正則化の強さ（β は非正則化）
  lr?: number; // 学習率
  maxIter?: number; // 最大反復回数
  tol?: number; // 収束判定（勾配の最大絶対値）
};

// オーバーフローを避けた数値的に安定なロジスティック関数。
const sigmoid = (z: number): number =>
  z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));

/**
 * Bradley-Terry 型の L2 正則化ロジスティック回帰で、各プロトコルの強度 θ と
 * 先攻補正 β を推定する。
 *
 *   P(先攻勝ち) = σ( β + Σ_{p∈first} θ_p − Σ_{p∈second} θ_p )
 *
 * 両デッキとも3枚なので全 θ に定数を足しても差が不変（列が線形従属）。L2 正則化
 * （β を除く）が最小ノルム解を選び一意化し、θ をおおよそ 0 中心へ縮小する
 * （データが少ないほど 0=五分へシュリンクし過信を防ぐ）。初期値 θ=0,β=0 の決定的実装。
 */
export const fitStrengthModel = (
  matches: Match[],
  options: StrengthModelOptions = {},
): StrengthModel => {
  // バッチ勾配降下。L2 項により1ステップの θ 収縮率は (1 - lr·lambda) なので、
  // 安定には lr·lambda < 2 が必要（既定 0.5·0.1=0.05 は十分安定）。
  const { lambda = 0.1, lr = 0.5, maxIter = 2000, tol = 1e-6 } = options;

  // 有効試合のみを抽出し、各試合を「先攻3枚・後攻3枚・先攻勝ちか」に正規化する。
  const samples: { first: Trio; second: Trio; y: number }[] = [];
  for (const mt of matches) {
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;
    samples.push({
      first: mt.first,
      second: mt.second,
      y: mt.winner === "FIRST" ? 1 : 0,
    });
  }

  const games = samples.length;
  if (games === 0) {
    return {
      theta: {},
      firstAdvantage: 0,
      games: 0,
      iterations: 0,
      converged: true,
    };
  }

  // 出現プロトコルにインデックスを割り当てる。
  const index = new Map<string, number>();
  for (const s of samples) {
    for (const p of [...s.first, ...s.second]) {
      if (!index.has(p)) index.set(p, index.size);
    }
  }
  const dim = index.size;
  const theta = new Float64Array(dim);
  let beta = 0;

  let iterations = 0;
  let converged = false;
  for (let it = 0; it < maxIter; it += 1) {
    iterations = it + 1;
    const gradTheta = new Float64Array(dim);
    let gradBeta = 0;

    for (const s of samples) {
      let logit = beta;
      for (const p of s.first) logit += theta[index.get(p) as number];
      for (const p of s.second) logit -= theta[index.get(p) as number];
      const err = sigmoid(logit) - s.y;
      gradBeta += err;
      for (const p of s.first) gradTheta[index.get(p) as number] += err;
      for (const p of s.second) gradTheta[index.get(p) as number] -= err;
    }

    // 平均勾配 + L2（β は非正則化）。
    gradBeta /= games;
    let maxGrad = Math.abs(gradBeta);
    for (let i = 0; i < dim; i += 1) {
      gradTheta[i] = gradTheta[i] / games + lambda * theta[i];
      if (Math.abs(gradTheta[i]) > maxGrad) maxGrad = Math.abs(gradTheta[i]);
    }

    beta -= lr * gradBeta;
    for (let i = 0; i < dim; i += 1) theta[i] -= lr * gradTheta[i];

    if (maxGrad < tol) {
      converged = true;
      break;
    }
  }

  const thetaOut: Record<string, number> = {};
  for (const [p, i] of index) thetaOut[p] = theta[i];

  return {
    theta: thetaOut,
    firstAdvantage: beta,
    games,
    iterations,
    converged,
  };
};

// --- ペアシナジー残差 -------------------------------------------------------

export type SynergyPair = {
  n: string; // "P · Q"
  g: number;
  actual: number; // 実測勝率 (0..100)
  expected: number; // モデル期待勝率 (0..100)
  residual: number; // actual - expected（パーセントポイント、小数1桁）
};

/**
 * ペア (p,q) の「実測勝率」と「強度モデル(θ/β)が予測する期待勝率」の差＝シナジー残差を返す。
 *
 * side S（3枚）が相手 O（3枚）と戦うときのモデル予測勝率は
 *   P(S 勝ち) = σ( (S が先攻なら +β, 後攻なら −β) + Σθ_S − Σθ_O )
 * これを makeStats と同じ走査でペア単位に平均し、実測勝率との差を取る。
 * 正の残差＝個々の強さ以上に噛み合う（相乗）、負＝噛み合わない（反シナジー）。
 *
 * 残差降順（同値は g 降順）。g < minGames は除外。model.games===0 なら空配列。
 */
export const pairSynergy = (
  matches: Match[],
  model: StrengthModel,
  minGames = MIN_GAMES_FOR_PAIR_STATS,
): SynergyPair[] => {
  if (model.games === 0) return [];

  const beta = model.firstAdvantage;
  const th = (p: string) => model.theta[p] ?? 0;

  const acc: Record<string, { g: number; a: number; e: number }> = {};
  const bump = (k: string, won: number, pred: number) => {
    if (!acc[k]) acc[k] = { g: 0, a: 0, e: 0 };
    acc[k].g += 1;
    acc[k].a += won;
    acc[k].e += pred;
  };

  for (const mt of matches) {
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;
    const firstWin = mt.winner === "FIRST";
    const sides = [
      { t: mt.first, opp: mt.second, isFirst: true, won: firstWin },
      { t: mt.second, opp: mt.first, isFirst: false, won: !firstWin },
    ];

    for (const s of sides) {
      const sumS = th(s.t[0]) + th(s.t[1]) + th(s.t[2]);
      const sumO = th(s.opp[0]) + th(s.opp[1]) + th(s.opp[2]);
      const pred = sigmoid((s.isFirst ? beta : -beta) + sumS - sumO);
      const wonNum = s.won ? 1 : 0;
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          const key = [s.t[i], s.t[j]].sort().join(" · ");
          bump(key, wonNum, pred);
        }
      }
    }
  }

  const out: SynergyPair[] = [];
  for (const [n, v] of Object.entries(acc)) {
    if (v.g < minGames) continue;
    const actual = Math.round((v.a / v.g) * 1000) / 10;
    const expected = Math.round((v.e / v.g) * 1000) / 10;
    const residual = Math.round((actual - expected) * 10) / 10;
    out.push({ n, g: v.g, actual, expected, residual });
  }
  out.sort((x, y) =>
    y.residual !== x.residual ? y.residual - x.residual : y.g - x.g,
  );
  return out;
};

// --- 相性表の残差（実測勝率 − モデル期待勝率）-------------------------------

/**
 * 相性表 matchup と同じ有向ペア走査で、各セル (a,b)＝「a を含む side が b を含む side に
 * 勝った実測勝率」と「強度モデル(θ/β)が予測する勝率」の差（残差, pp, 0中心）を返す。
 *
 * 各試合の P(先攻勝ち) = σ(β + Σθ_first − Σθ_second) を予測とし、(lp∈first, rp∈second) と
 * その逆 (rp∈first 視点) の双方を集計する。g < minGames のセルは null（実測 matchup と同じ閾値）。
 * 正＝個々の強さ以上に有利、負＝不利。交絡を外した「真のカウンター」を表す。
 */
export const matchupResidual = (
  list: Match[],
  model: StrengthModel,
  protocols: readonly Protocol[] = ALL_PROTOCOLS,
  minGames = MIN_GAMES_FOR_MATRIX,
): MatrixData => {
  const beta = model.firstAdvantage;
  const th = (p: string) => model.theta[p] ?? 0;

  // 有向ペアキー → { g, 実測勝利数 w, モデル予測勝率の総和 e }
  const r: Record<string, { g: number; w: number; e: number }> = {};
  const bump = (k: string, won: number, pred: number) => {
    if (!r[k]) r[k] = { g: 0, w: 0, e: 0 };
    r[k].g += 1;
    r[k].w += won;
    r[k].e += pred;
  };

  for (const mt of list) {
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;
    const firstWin = mt.winner === "FIRST" ? 1 : 0;
    const sumF = th(mt.first[0]) + th(mt.first[1]) + th(mt.first[2]);
    const sumS = th(mt.second[0]) + th(mt.second[1]) + th(mt.second[2]);
    const predFirst = sigmoid(beta + sumF - sumS); // P(先攻勝ち)

    for (const lp of mt.first) {
      for (const rp of mt.second) {
        bump(`${lp}__${rp}`, firstWin, predFirst);
        bump(`${rp}__${lp}`, 1 - firstWin, 1 - predFirst);
      }
    }
  }

  const m: MatrixData = {};
  for (const a of protocols) {
    m[a] = {};
    for (const b of protocols) {
      m[a][b] = null;
    }
  }
  for (const [k, v] of Object.entries(r)) {
    const [aStr, bStr] = k.split("__");
    const a = aStr as Protocol;
    const b = bStr as Protocol;
    if (m[a] && v.g >= minGames) {
      // 実測% − 期待%（pp、小数1桁）
      m[a][b] = Math.round(((v.w - v.e) / v.g) * 1000) / 10;
    }
  }

  return m;
};

// --- アーキタイプ（共起クラスタリング）-------------------------------------

export type Archetype = {
  id: number;
  label: string; // 所属プロトコルを "/" 連結
  protocols: string[];
};

// 共起重み（同一 trio で一緒に出た回数）の対称行列とノード一覧を作る内部ヘルパー。
const buildCooccurrence = (
  matches: Match[],
): { w: Map<string, Map<string, number>>; nodes: string[] } => {
  const w = new Map<string, Map<string, number>>();
  const nodeSet = new Set<string>();
  const add = (a: string, b: string) => {
    if (!w.has(a)) w.set(a, new Map());
    const row = w.get(a) as Map<string, number>;
    row.set(b, (row.get(b) ?? 0) + 1);
  };
  for (const mt of matches) {
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;
    for (const trio of [mt.first, mt.second]) {
      for (const p of trio) nodeSet.add(p);
      for (let i = 0; i < 3; i += 1) {
        for (let j = i + 1; j < 3; j += 1) {
          add(trio[i], trio[j]);
          add(trio[j], trio[i]);
        }
      }
    }
  }
  return { w, nodes: [...nodeSet].sort() };
};

/**
 * プロトコルの共起グラフ。weight(a, b) は a と b が同一 trio で一緒に握られた回数。
 */
export const protocolCooccurrence = (
  matches: Match[],
): { nodes: string[]; weight: (a: string, b: string) => number } => {
  const { w, nodes } = buildCooccurrence(matches);
  return { nodes, weight: (a, b) => w.get(a)?.get(b) ?? 0 };
};

/**
 * 共起グラフを貪欲モジュラリティ最大化（凝集型）でクラスタリングし、アーキタイプを抽出する。
 * 各ノード単独から開始し、モジュラリティ利得 ΔQ が最大の2コミュニティを併合、ΔQ>0 が
 * 無くなるまで反復する。決定的（同点は (lo,hi) の小さい方で破る）。n≤27 なので素朴実装で十分。
 */
export const detectArchetypes = (matches: Match[]): Archetype[] => {
  const { w, nodes } = buildCooccurrence(matches);
  if (nodes.length === 0) return [];

  // 重み付き次数 k_i と 2m
  const degree = new Map<string, number>();
  let twoM = 0;
  for (const a of nodes) {
    let k = 0;
    const row = w.get(a);
    if (row) for (const v of row.values()) k += v;
    degree.set(a, k);
    twoM += k;
  }

  const comm = new Map<string, number>();
  nodes.forEach((p, i) => {
    comm.set(p, i);
  });

  if (twoM > 0) {
    // a<b のエッジ一覧（重み w[a][b]）
    const edges: { a: string; b: string; w: number }[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const wij = w.get(nodes[i])?.get(nodes[j]) ?? 0;
        if (wij > 0) edges.push({ a: nodes[i], b: nodes[j], w: wij });
      }
    }

    while (true) {
      // コミュニティ次数和 a_C
      const aOf = new Map<number, number>();
      for (const p of nodes) {
        const c = comm.get(p) as number;
        aOf.set(c, (aOf.get(c) ?? 0) + (degree.get(p) as number));
      }
      // コミュニティ間重み e_CD（lo<hi）
      const eBetween = new Map<string, number>();
      for (const e of edges) {
        const ca = comm.get(e.a) as number;
        const cb = comm.get(e.b) as number;
        if (ca === cb) continue;
        const lo = Math.min(ca, cb);
        const hi = Math.max(ca, cb);
        eBetween.set(`${lo}_${hi}`, (eBetween.get(`${lo}_${hi}`) ?? 0) + e.w);
      }

      // ΔQ 最大ペア（決定的: キー昇順で厳密最大、同点は先勝ち＝小さいキー）
      const pairs = [...eBetween.entries()]
        .map(([key, e]) => {
          const [loS, hiS] = key.split("_");
          return { lo: Number(loS), hi: Number(hiS), e };
        })
        .sort((x, y) => x.lo - y.lo || x.hi - y.hi);

      let bestGain = 1e-12;
      let bestLo = -1;
      let bestHi = -1;
      for (const { lo, hi, e } of pairs) {
        const gain =
          2 *
          (e / twoM -
            ((aOf.get(lo) as number) * (aOf.get(hi) as number)) /
              (twoM * twoM));
        if (gain > bestGain) {
          bestGain = gain;
          bestLo = lo;
          bestHi = hi;
        }
      }
      if (bestLo === -1) break;
      // bestHi を bestLo に併合
      for (const p of nodes) {
        if (comm.get(p) === bestHi) comm.set(p, bestLo);
      }
    }
  }

  // コミュニティ -> プロトコル
  const byComm = new Map<number, string[]>();
  for (const p of nodes) {
    const c = comm.get(p) as number;
    if (!byComm.has(c)) byComm.set(c, []);
    (byComm.get(c) as string[]).push(p);
  }
  const groups = [...byComm.values()].map((ps) => [...ps].sort());
  // サイズ降順 → 先頭プロトコル昇順
  groups.sort((x, y) => y.length - x.length || (x[0] < y[0] ? -1 : 1));
  return groups.map((ps, i) => ({ id: i, label: ps.join("/"), protocols: ps }));
};

export type ArchetypeMatchup = {
  archetypes: Archetype[];
  // matrix[i][j] = アーキタイプ i の side が j の side に勝った勝率(0..100)。g<minGames は null。
  matrix: (number | null)[][];
  games: number[][];
};

/**
 * 各デッキを「3枚の多数決」でアーキタイプに割り当て、アーキタイプ間の相性を集計する。
 * 27×27 の疎な相性表より密で解釈しやすい。
 */
export const archetypeMatchup = (
  matches: Match[],
  minGames = MIN_GAMES_FOR_MATRIX,
): ArchetypeMatchup => {
  const archetypes = detectArchetypes(matches);
  const n = archetypes.length;

  const archOf = new Map<string, number>();
  archetypes.forEach((a, i) => {
    for (const p of a.protocols) archOf.set(p, i);
  });

  // trio を所属アーキタイプの多数決で割り当てる（同点は小さい index）。
  const assign = (trio: Trio): number => {
    const counts = new Map<number, number>();
    for (const p of trio) {
      const idx = archOf.get(p);
      if (idx === undefined) continue;
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    let bestIdx = -1;
    let bestCount = 0;
    for (const [idx, c] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
      if (c > bestCount) {
        bestCount = c;
        bestIdx = idx;
      }
    }
    return bestIdx;
  };

  const games: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(0),
  );
  const wins: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(0),
  );

  for (const mt of matches) {
    if (!isValidTrio(mt.first) || !isValidTrio(mt.second)) continue;
    const fa = assign(mt.first);
    const sa = assign(mt.second);
    if (fa < 0 || sa < 0) continue;
    const firstWin = mt.winner === "FIRST" ? 1 : 0;
    games[fa][sa] += 1;
    wins[fa][sa] += firstWin;
    // 異アーキタイプは後攻側視点も加算（対称な相補関係）。同一は二重計上を避ける。
    if (fa !== sa) {
      games[sa][fa] += 1;
      wins[sa][fa] += 1 - firstWin;
    }
  }

  const matrix: (number | null)[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      games[i][j] >= minGames ? percent(wins[i][j], games[i][j]) : null,
    ),
  );

  return { archetypes, matrix, games };
};
