import { describe, expect, it } from "vitest";
import { RATIO_SETS, SEASONS_CONFIG } from "../config";
import { buildRatioTableComment } from "./useCsvExport";

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
