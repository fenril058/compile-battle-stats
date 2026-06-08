import { describe, expect, it } from "vitest";
import {
  formatCalendarDate,
  formatCalendarDateForCsv,
  parseCalendarDate,
  todayInputValue,
} from "./date";

describe("utils/date (暦日・UTC正準) #69", () => {
  describe("parseCalendarDate", () => {
    it("ハイフン区切りを UTC 真夜中として解釈する", () => {
      expect(parseCalendarDate("2024-12-25")).toBe(Date.UTC(2024, 11, 25));
    });

    it("区切り文字に依存せず同じ UTC 真夜中を返す", () => {
      const expected = Date.UTC(2024, 11, 25);
      expect(parseCalendarDate("2024/12/25")).toBe(expected);
      expect(parseCalendarDate("2024.12.25")).toBe(expected);
      expect(parseCalendarDate("2024-12-25")).toBe(expected);
    });

    it("1桁の月日も受け付ける", () => {
      expect(parseCalendarDate("2024/1/3")).toBe(Date.UTC(2024, 0, 3));
    });

    it("空文字・空白・null・undefined は null", () => {
      expect(parseCalendarDate("")).toBeNull();
      expect(parseCalendarDate("   ")).toBeNull();
      expect(parseCalendarDate(null)).toBeNull();
      expect(parseCalendarDate(undefined)).toBeNull();
    });

    it("形式不正・存在しない日付は null（桁あふれを丸めない）", () => {
      expect(parseCalendarDate("not-a-date")).toBeNull();
      expect(parseCalendarDate("2024-13-01")).toBeNull(); // 13月
      expect(parseCalendarDate("2024-02-30")).toBeNull(); // 2/30
      expect(parseCalendarDate("2024-12-25T00:00")).toBeNull(); // 余分な時刻
    });

    it("常に UTC 真夜中（隠れたローカルオフセットを持たない）", () => {
      const ts = parseCalendarDate("2024-06-01") as number;
      const d = new Date(ts);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
      expect(d.getUTCSeconds()).toBe(0);
    });
  });

  describe("formatCalendarDateForCsv", () => {
    it("UTC 真夜中をゼロ埋め YYYY/MM/DD（UTC）に整形する", () => {
      expect(formatCalendarDateForCsv(Date.UTC(2024, 0, 3))).toBe("2024/01/03");
    });

    it("parseCalendarDate と round-trip 可逆", () => {
      const ts = Date.UTC(2025, 11, 31);
      expect(parseCalendarDate(formatCalendarDateForCsv(ts))).toBe(ts);
    });
  });

  describe("formatCalendarDate (表示)", () => {
    it("null/undefined は '-'", () => {
      expect(formatCalendarDate(null)).toBe("-");
      expect(formatCalendarDate(undefined)).toBe("-");
    });

    it("UTC 固定なので暦日がずれずに整形される", () => {
      // ロケールにより並びは違っても、年月日の各要素は必ず含まれる
      const out = formatCalendarDate(Date.UTC(2024, 11, 25));
      expect(out).toContain("2024");
      expect(out).toContain("12");
      expect(out).toContain("25");
    });
  });

  describe("todayInputValue", () => {
    it("ローカル暦日を YYYY-MM-DD 形式で返す", () => {
      expect(todayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
