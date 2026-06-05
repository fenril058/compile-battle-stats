import type React from "react";
import { ABBR, MIN_GAMES_FOR_MATRIX } from "../config";
import { useT } from "../i18n";
import type { MatrixData, Protocol } from "../types";

// 残差の絶対値をこの値でクランプしてから強度にマッピングする（pp 単位）
const RESIDUAL_CLAMP_PP = 30;

// green-700 / red-700 に相当する RGB 値
const GREEN_RGB = "21,128,61";
const RED_RGB = "185,28,28";

/** 残差値を連続発散グラデーションの inline style に変換する。 */
function residualCellStyle(v: number): React.CSSProperties {
  const intensity = Math.min(Math.abs(v) / RESIDUAL_CLAMP_PP, 1);
  const alpha = (intensity * 0.8 + 0.1).toFixed(2);
  if (v > 0)
    return { backgroundColor: `rgba(${GREEN_RGB},${alpha})`, color: "white" };
  if (v < 0)
    return { backgroundColor: `rgba(${RED_RGB},${alpha})`, color: "white" };
  return { backgroundColor: "rgba(63,63,70,0.4)" };
}

type MatrixProps = {
  title: string;
  m: MatrixData;
  bg: string;
  protocols: readonly Protocol[];
  // "winRate"（既定）: 0..100 を 50 中心で配色。
  // "residual": モデル残差(pp, 0中心)を発散配色＋符号付きで表示。
  variant?: "winRate" | "residual";
  // 行ヘッダに併記する各プロトコルの強度 θ（任意）。残差表で「行が強い/弱い」を
  // 読み取りやすくする。未指定なら従来どおり略号のみ。
  theta?: Record<string, number>;
};

/** θ を符号付き小数2桁で整形（θ+0.30 / θ−0.12）。 */
const formatTheta = (v: number): string =>
  `θ = ${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;

export const Matrix: React.FC<MatrixProps> = ({
  title,
  m,
  bg,
  protocols,
  variant = "winRate",
  theta,
}) => {
  const { t } = useT();
  // プロトコルがない場合は、最低限の高さだけ持つ空の箱を返す
  if (!protocols || protocols.length === 0) {
    return (
      <div className={`p-4 rounded-2xl mb-6 ${bg} h-[500px] animate-pulse`} />
    );
  }

  return (
    <div className={`p-4 rounded-2xl mb-6 ${bg}`}>
      <h2 className="text-lg font-semibold mb-2 text-center h-7">
        {" "}
        {/* 高さを固定 */}
        {t("matrix.gamesHeading", { title, games: MIN_GAMES_FOR_MATRIX })}
      </h2>
      <div
        // biome-ignore lint/a11y/noNoninteractiveTabindex: スクロール可能領域はキーボード操作のため focusable にする必要がある（scrollable-region-focusable）
        tabIndex={0}
        className="relative overflow-x-auto max-h-[500px]
        border border-zinc-800 rounded-md"
        style={{ minHeight: "400px" }} // おおよその最小高さを確保
      >
        <table className="w-full text-xs min-w-[300px]">
          <caption className="sr-only">
            {t("matrix.gamesHeading", { title, games: MIN_GAMES_FOR_MATRIX })}
          </caption>
          <thead className="sticky top-0 z-20 bg-zinc-800 text-zinc-300">
            <tr>
              <th
                className="px-2 py-1 sticky left-0 z-10 bg-zinc-800"
                scope="col"
              >
                {t("matrix.cornerLabel")}
              </th>
              {protocols.map((p) => (
                <th key={`h-${p}`} className="px-2 py-1" scope="col">
                  {ABBR[p] ?? p.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {protocols.map((a) => (
              <tr key={`r-${a}`} className="h-[28px]">
                <th
                  className="bg-zinc-800 px-2 py-1 sticky left-0 z-10 bg-zinc-800 whitespace-nowrap"
                  scope="row"
                >
                  {ABBR[a] ?? a.slice(0, 3)}
                  {theta && theta[a] !== undefined && (
                    <span className="ml-1 text-[9px] font-normal text-zinc-400 tabular-nums">
                      {formatTheta(theta[a])}
                    </span>
                  )}
                </th>
                {protocols.map((b) => {
                  const row = m[a];
                  const v = row ? row[b] : null;

                  // データがない（ロード中含む）場合は「–」か空セルを表示
                  if (v === null || v === undefined) {
                    return (
                      <td
                        key={`c-${a}-${b}`}
                        className="p-1 text-zinc-700 text-center"
                      >
                        –
                      </td>
                    );
                  }
                  const label =
                    variant === "residual"
                      ? `${v > 0 ? "+" : ""}${v.toFixed(0)}`
                      : v.toFixed(0);
                  if (variant === "residual") {
                    return (
                      <td
                        key={`c-${a}-${b}`}
                        className="p-1 text-center"
                        style={residualCellStyle(v)}
                      >
                        {label}
                      </td>
                    );
                  }
                  // winRate: 50 中心で 3 段階配色
                  const tone =
                    v > 60
                      ? "bg-green-700/40"
                      : v < 40
                        ? "bg-red-700/40"
                        : "bg-zinc-700/40";
                  return (
                    <td
                      key={`c-${a}-${b}`}
                      className={`p-1 text-center ${tone}`}
                    >
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
