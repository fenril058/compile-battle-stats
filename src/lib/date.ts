/**
 * 対戦日 (matchDate) のための日付ユーティリティ。
 *
 * matchDate は「いつ対戦したか」という **暦日** を表す値であり、瞬間ではない。
 * timestamp(number) に格納する都合上どうしても TZ 解釈が必要になるため、
 * **UTC 真夜中を正準表現** とし、入力のパースも表示も CSV 書出も常に UTC で行う。
 * これにより閲覧端末・ユーザーの TZ に依存せず日付がずれず、
 * エクスポート→再インポートの round-trip も可逆になる（#69）。
 *
 * 一方 createdAt は「登録した瞬間」なのでローカル表示のままが自然（本ファイル対象外）。
 */

const CALENDAR_DATE_RE = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * "YYYY-MM-DD" / "YYYY/MM/DD" / "YYYY.MM.DD" の暦日文字列を
 * **UTC 真夜中** のタイムスタンプに変換する。
 * 空文字・null・形式不正・存在しない日付（13月や2/30 など）は null を返す。
 */
export const parseCalendarDate = (
  input: string | null | undefined,
): number | null => {
  if (!input) return null;
  const m = CALENDAR_DATE_RE.exec(input.trim());
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  const ts = Date.UTC(year, month - 1, day);
  const d = new Date(ts);
  // Date.UTC は桁あふれを丸めてしまう（例: 2/30 → 3/2）。
  // UTC コンポーネントが入力と一致することを確認して不正な日付を弾く。
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return ts;
};

/**
 * CSV 書出用。UTC 真夜中のタイムスタンプを "YYYY/MM/DD"（UTC・ゼロ埋め）に整形する。
 * ロケールに依存しない固定フォーマットなので、parseCalendarDate と round-trip 可逆。
 */
export const formatCalendarDateForCsv = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}/${pad2(d.getUTCMonth() + 1)}/${pad2(d.getUTCDate())}`;
};

// 表示用フォーマッタ（ロケールは環境依存だが timeZone は UTC に固定）。
// インスタンスを使い回して生成コストを抑える。
const displayFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

/**
 * 一覧表示用。UTC 真夜中のタイムスタンプを、閲覧 TZ に依存せず暦日として整形する。
 * null/undefined は "-"（未入力の空欄表現）。
 */
export const formatCalendarDate = (ts: number | null | undefined): string => {
  if (!ts) return "-";
  return displayFormatter.format(new Date(ts));
};

/**
 * <input type="date"> の既定値用。閲覧者の **ローカル** 暦日を "YYYY-MM-DD" で返す。
 * （ユーザーが「今日」と感じる日付を初期表示し、保存時に parseCalendarDate で
 * その暦日の UTC 真夜中へ正規化する。toISOString は UTC 日付になり夜間にずれるため使わない。）
 */
export const todayInputValue = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
