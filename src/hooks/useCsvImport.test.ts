import { act, renderHook, waitFor } from "@testing-library/react";
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

/** useCsvImport を初期化し、result を返す */
const setup = (userId?: string, requireLogin = false) => {
  const addBatch = vi.fn<AddBatch>().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useCsvImport(
      addBatch,
      PROTOCOLS,
      RATIOS,
      MAX_RATIO,
      RATIO_PROTOCOLS,
      userId,
      requireLogin,
    ),
  );
  return { addBatch, result };
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

  it("CSV以外のファイルは拒否し、preview を設定しない", async () => {
    const { addBatch, result } = setup();

    // application/json + .json 拡張子は拒否される
    const file = new File(["a,b,c"], "import.json", {
      type: "application/json",
    });
    act(() => {
      result.current.handleImportCsv({
        target: { files: [file], value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview).toBeNull();
  });

  it("拡張子が .csv なら MIME タイプが不正でも許容され、preview に payloads が入る", async () => {
    const { addBatch, result } = setup();

    // 空の MIME タイプだが、ファイル名が .csv なので許容
    const file = new File(
      ["FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,"],
      "import.csv",
      { type: "" },
    );
    act(() => {
      result.current.handleImportCsv({
        target: { files: [file], value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview?.payloads).toHaveLength(1);
    expect(result.current.preview?.failures).toHaveLength(0);
  });

  it("コメント行(#)・空行をスキップし、有効行が preview.payloads に入る", async () => {
    const { addBatch, result } = setup();

    const csv = [
      "# Compile Battle Stats — Season 1",
      "# Ratio Table: ...",
      "# 先攻プロトコル1,先攻プロトコル2,先攻プロトコル3",
      "",
      "   ", // 空白のみの行
      "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,2025/01/01",
      "DARKNESS,PSYCHIC,LIGHT,DEATH,GRAVITY,PLAGUE,SECOND,",
    ].join("\n");

    act(() => {
      result.current.handleImportCsv(makeChangeEvent(csv));
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    const payloads = result.current.preview?.payloads ?? [];
    expect(payloads).toHaveLength(2);
    expect(payloads[0].first).toEqual(["FIRE", "WATER", "METAL"]);
    expect(payloads[0].winner).toBe("FIRST");
    expect(payloads[1].winner).toBe("SECOND");
    expect(result.current.preview?.failures).toHaveLength(0);
  });

  it("userId を渡すと preview.payloads の各行に所有者が付与される", async () => {
    const { addBatch, result } = setup("owner-123");

    act(() => {
      result.current.handleImportCsv(
        makeChangeEvent(
          "fire,water,metal,life,spirit,speed,first,\n" +
            "fire,water,metal,life,spirit,speed,second,",
        ),
      );
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    const payloads = result.current.preview?.payloads ?? [];
    expect(payloads).toHaveLength(2);
    expect(payloads.every((p) => p.userId === "owner-123")).toBe(true);
  });

  it("小文字入力も大文字化して preview.payloads に取り込める", async () => {
    const { addBatch, result } = setup();

    act(() => {
      result.current.handleImportCsv(
        makeChangeEvent("fire,water,metal,life,spirit,speed,first,"),
      );
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview?.payloads[0].first).toEqual([
      "FIRE",
      "WATER",
      "METAL",
    ]);
  });

  it("有効行と無効行が混在する場合、preview に payloads と failures が両方入る", async () => {
    const { addBatch, result } = setup();

    const invalidLine1 = "FIRE,WATER,INVALID,LIFE,SPIRIT,SPEED,FIRST,";
    const invalidLine2 = "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,DRAW,";
    const csv = [
      "FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,", // 有効
      invalidLine1, // 不正プロトコル
      invalidLine2, // 不正な勝者
    ].join("\n");

    act(() => {
      result.current.handleImportCsv(makeChangeEvent(csv));
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview?.payloads).toHaveLength(1);
    expect(result.current.preview?.failures).toHaveLength(2);
    expect(result.current.preview?.failures[0]).toBe(invalidLine1);
    expect(result.current.preview?.failures[1]).toBe(invalidLine2);
    // トーストは出ない（プレビューで表示するため）
    expect(toast.warn).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("全行失敗の場合でも preview が設定され、payloads は空・failures には行が入る", async () => {
    const { addBatch, result } = setup();

    act(() => {
      result.current.handleImportCsv(
        makeChangeEvent("BROKEN,ROW\nALSO,BROKEN"),
      );
    });

    await waitFor(() => expect(result.current.preview).not.toBeNull());

    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview?.payloads).toHaveLength(0);
    expect(result.current.preview?.failures).toHaveLength(2);
  });

  it("ファイル未選択なら何もしない", () => {
    const { addBatch, result } = setup();

    act(() => {
      result.current.handleImportCsv({
        target: { files: [], value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(addBatch).not.toHaveBeenCalled();
    expect(result.current.preview).toBeNull();
  });

  it("requireLogin: true のとき preview を設定せず、エラートーストを出し、input をリセットする", () => {
    const { addBatch, result } = setup(undefined, true);

    const event = makeChangeEvent("FIRE,WATER,METAL,LIFE,SPIRIT,SPEED,FIRST,");
    act(() => {
      result.current.handleImportCsv(event);
    });

    expect(addBatch).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(event.target.value).toBe("");
    expect(result.current.preview).toBeNull();
  });

  describe("confirmImport", () => {
    it("addBatch が payloads(userId/createdAt 含む) 付きで呼ばれ、preview がクリアされる", async () => {
      const { addBatch, result } = setup("user-abc");

      // プレビューをセット
      act(() => {
        result.current.handleImportCsv(
          makeChangeEvent("fire,water,metal,life,spirit,speed,first,"),
        );
      });
      await waitFor(() => expect(result.current.preview).not.toBeNull());

      // 確定
      await act(async () => {
        await result.current.confirmImport();
      });

      expect(addBatch).toHaveBeenCalledTimes(1);
      const payloads = addBatch.mock.calls[0][0];
      expect(payloads).toHaveLength(1);
      expect(payloads[0].userId).toBe("user-abc");
      expect(typeof payloads[0].createdAt).toBe("number");
      // プレビューがクリアされる
      expect(result.current.preview).toBeNull();
    });

    it("payloads が 0 件のとき addBatch を呼ばない", async () => {
      const { addBatch, result } = setup();

      // 全行失敗のプレビューをセット
      act(() => {
        result.current.handleImportCsv(makeChangeEvent("BROKEN,ROW"));
      });
      await waitFor(() => expect(result.current.preview).not.toBeNull());
      expect(result.current.preview?.payloads).toHaveLength(0);

      await act(async () => {
        await result.current.confirmImport();
      });

      expect(addBatch).not.toHaveBeenCalled();
    });
  });

  describe("cancelImport", () => {
    it("preview がクリアされる", async () => {
      const { result } = setup();

      act(() => {
        result.current.handleImportCsv(
          makeChangeEvent("fire,water,metal,life,spirit,speed,first,"),
        );
      });
      await waitFor(() => expect(result.current.preview).not.toBeNull());

      act(() => {
        result.current.cancelImport();
      });

      expect(result.current.preview).toBeNull();
    });
  });
});
