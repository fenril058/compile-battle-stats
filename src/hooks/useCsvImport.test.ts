import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROTOCOL_SETS, RATIO_SETS } from "../config";
import type { Match, Protocol } from "../types";

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from "react-toastify";
import { useCsvImport } from "./useCsvImport";

const PROTOCOLS = PROTOCOL_SETS.V1 as unknown as readonly Protocol[];
const RATIOS = RATIO_SETS.S1;
const MAX_RATIO = 8;
const RATIO_PROTOCOLS = PROTOCOL_SETS.V1;

type AddBatch = (payload: Omit<Match, "id">[]) => Promise<void>;

/** useCsvImport を初期化し、handleImportCsv と addBatch スパイを返す */
const setup = () => {
  const addBatch = vi.fn<AddBatch>().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useCsvImport(addBatch, PROTOCOLS, RATIOS, MAX_RATIO, RATIO_PROTOCOLS),
  );
  return { addBatch, handleImportCsv: result.current.handleImportCsv };
};

/** CSV文字列から File を生成し、change イベント風オブジェクトに包む */
const makeChangeEvent = (
  content: string,
  type = "text/csv",
): React.ChangeEvent<HTMLInputElement> => {
  const file = new File([content], "import.csv", { type });
  return {
    target: { files: [file], value: "stale-value" },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

describe("useCsvImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CSV以外のファイルは拒否し、batch を呼ばない", async () => {
    const { addBatch, handleImportCsv } = setup();

    // application/json + .json 拡張子は拒否される
    const file = new File(["a,b,c"], "import.json", {
      type: "application/json",
    });
    handleImportCsv({
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(addBatch).not.toHaveBeenCalled();
  });

  it("拡張子が .csv なら MIME タイプが不正でも許容される", async () => {
    const { addBatch, handleImportCsv } = setup();

    // 空の MIME タイプだが、ファイル名が .csv なので許容
    const file = new File(
      ["FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,"],
      "import.csv",
      { type: "" },
    );
    handleImportCsv({
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>);

    await waitFor(() => expect(addBatch).toHaveBeenCalledTimes(1));
    expect(addBatch.mock.calls[0][0]).toHaveLength(1);
  });

  it("コメント行(#)・空行をスキップし、有効行のみ batch する", async () => {
    const { addBatch, handleImportCsv } = setup();

    const csv = [
      "# Compile Battle Stats — Season 1",
      "# Ratio Table: ...",
      "# 先攻プロトコル1,先攻プロトコル2,先攻プロトコル3",
      "",
      "   ", // 空白のみの行
      "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,2025/01/01",
      "DARKNESS,PSYCHIC,LIGHT,DEATH,GRAVITY,PLAGUE,SECOND,",
    ].join("\n");

    handleImportCsv(makeChangeEvent(csv));

    await waitFor(() => expect(addBatch).toHaveBeenCalledTimes(1));

    const payloads = addBatch.mock.calls[0][0];
    expect(payloads).toHaveLength(2);
    expect(payloads[0].first).toEqual(["FIRE", "WATER", "METAL"]);
    expect(payloads[0].winner).toBe("FIRST");
    expect(payloads[1].winner).toBe("SECOND");
    // 失敗行が無いので warn は呼ばれない
    expect(toast.warn).not.toHaveBeenCalled();
  });

  it("小文字入力も大文字化して取り込める", async () => {
    const { addBatch, handleImportCsv } = setup();

    handleImportCsv(
      makeChangeEvent("fire,water,metal,life,spirit,speed,first,"),
    );

    await waitFor(() => expect(addBatch).toHaveBeenCalledTimes(1));
    expect(addBatch.mock.calls[0][0][0].first).toEqual([
      "FIRE",
      "WATER",
      "METAL",
    ]);
  });

  it("有効行と無効行が混在する場合、有効行のみ batch し失敗を通知する", async () => {
    const { addBatch, handleImportCsv } = setup();

    const csv = [
      "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,", // 有効
      "FIRE,WATER,INVALID,LIFE,SPIRIT,SPEED,FIRST,", // 不正プロトコル
      "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,DRAW,", // 不正な勝者
    ].join("\n");

    handleImportCsv(makeChangeEvent(csv));

    await waitFor(() => expect(addBatch).toHaveBeenCalledTimes(1));

    expect(addBatch.mock.calls[0][0]).toHaveLength(1);
    // 個別 error は出ず、失敗件数と先頭例をまとめた warn が1件だけ出る
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warn).toHaveBeenCalledTimes(1);
    expect(toast.warn).toHaveBeenCalledWith(expect.stringContaining("2件失敗"));
  });

  it("有効行が1つも無ければ batch を呼ばない", async () => {
    const { addBatch, handleImportCsv } = setup();

    handleImportCsv(makeChangeEvent("BROKEN,ROW\nALSO,BROKEN"));

    await waitFor(() => expect(toast.warn).toHaveBeenCalled());
    expect(addBatch).not.toHaveBeenCalled();
  });

  it("ファイル未選択なら何もしない", () => {
    const { addBatch, handleImportCsv } = setup();

    handleImportCsv({
      target: { files: [], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>);

    expect(toast.error).not.toHaveBeenCalled();
    expect(addBatch).not.toHaveBeenCalled();
  });
});
