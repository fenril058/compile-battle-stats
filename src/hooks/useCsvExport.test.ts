import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RATIO_SETS, SEASONS_CONFIG } from "../config";
import type { Match } from "../types";

vi.mock("react-toastify", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { toast } from "react-toastify";
import { buildRatioTableComment, useCsvExport } from "./useCsvExport";

describe("buildRatioTableComment", () => {
  const season = "compile_season3" as const;
  const config = SEASONS_CONFIG[season];
  const ratios = RATIO_SETS[config.ratioVer];

  const build = () =>
    buildRatioTableComment(
      season,
      ratios,
      config.maxRatio,
      config.ratioProtocols,
    );

  it("すべての行が '#' で始まる（インポート時にスキップされる）", () => {
    for (const line of build()) {
      expect(line.startsWith("#")).toBe(true);
    }
  });

  it("シーズン名・キー・maxRatio を含む", () => {
    const lines = build();
    expect(lines[0]).toContain(config.displayName);
    expect(lines[0]).toContain(season);
    expect(lines.some((l) => l.includes(`Max Ratio: ${config.maxRatio}`))).toBe(
      true,
    );
  });

  it("各プロトコルのレシオ値が protocol=ratio 形式で含まれる", () => {
    const text = build().join("\n");
    for (const [protocol, ratio] of Object.entries(ratios)) {
      expect(text).toContain(`${protocol}=${ratio}`);
    }
    // Season 3 固有の値を念のため検証
    expect(text).toContain("PSYCHIC=6");
  });

  it("レシオ対象プロトコル一覧が含まれる", () => {
    const lines = build();
    const eligibleLine = lines.find((l) =>
      l.includes("Ratio-eligible protocols:"),
    );
    expect(eligibleLine).toBeDefined();
    for (const protocol of config.ratioProtocols) {
      expect(eligibleLine).toContain(protocol);
    }
  });
});

describe("exportToCsv", () => {
  const season = "compile_season3" as const;
  const config = SEASONS_CONFIG[season];
  const ratios = RATIO_SETS[config.ratioVer];

  const renderExport = (matches: Match[]) => {
    const { result } = renderHook(() =>
      useCsvExport(
        matches,
        season,
        ratios,
        config.maxRatio,
        config.ratioProtocols,
      ),
    );
    return result.current.exportToCsv;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("データが無ければ info を出し、ダウンロードしない", () => {
    renderExport([])();

    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("データがあれば Blob を生成し download をトリガする", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const matches: Match[] = [
      {
        id: "1",
        first: ["FIRE", "WATER", "METAL"],
        second: ["LIFE", "SPIRIT", "SPEED"],
        winner: "FIRST",
        ratio: true,
        createdAt: 1700000000000,
        matchDate: new Date("2025/01/02").getTime(),
      },
    ];

    renderExport(matches)();

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledTimes(1);

    // 生成された Blob の中身（シリアライズ結果）を検証する
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const text = await blob.text();

    // レシオ表コメント・ヘッダー・データ行が揃っている
    expect(text).toContain(`# Compile Battle Stats — ${config.displayName}`);
    expect(text).toContain("# 先攻プロトコル1");
    expect(text).toContain('"FIRE"');
    expect(text).toContain('"SPEED"');
    // ratio: true は "TRUE" としてシリアライズされる
    expect(text).toContain('"TRUE"');
  });
});
