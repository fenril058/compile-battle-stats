import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ja } from "../i18n/ja";
import { Explainer } from "./Explainer";

describe("Explainer", () => {
  it("既定の summary ラベル（解説）と本文を描画する", () => {
    render(<Explainer bodyKey="stat.wilsonExplain" />);
    // 既定の summary は common.explainer
    expect(screen.getByText(ja["common.explainer"])).toBeInTheDocument();
    // 本文（Wilson 解説）が含まれる
    expect(
      screen.getByText(/Wilson 下限/, { exact: false }),
    ).toBeInTheDocument();
  });

  it("summaryKey を指定するとそのラベルを使う", () => {
    render(
      <Explainer bodyKey="archetype.explain" summaryKey="archetype.title" />,
    );
    expect(screen.getByText(ja["archetype.title"])).toBeInTheDocument();
  });

  it("折りたたみは既定で閉じている（details に open 属性がない）", () => {
    const { container } = render(<Explainer bodyKey="synergy.explain" />);
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.hasAttribute("open")).toBe(false);
  });
});
