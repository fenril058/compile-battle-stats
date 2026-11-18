import assert from "node:assert/strict";
import test from "node:test";
import { classifyAudit } from "./ci-audit.mjs";

const advisory = {
  name: "picomatch",
  url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
  severity: "high",
};
const report = (vulnerabilities) => ({
  auditReportVersion: 2,
  metadata: { vulnerabilities: { high: 0, critical: 0 } },
  vulnerabilities,
});

test("passes a clean audit", () => {
  assert.deepEqual(classifyAudit(report({})), { ignored: [], blocking: [] });
});

test("allows only the known picomatch advisory and its downstream impact", () => {
  assert.deepEqual(
    classifyAudit(
      report({
        picomatch: { severity: "high", via: [advisory] },
        fdir: { severity: "high", via: ["picomatch"] },
        vite: { severity: "high", via: ["fdir", "picomatch"] },
      }),
    ),
    { ignored: ["picomatch", "fdir", "vite"], blocking: [] },
  );
});

test("blocks a different advisory even when it affects picomatch", () => {
  const outcome = classifyAudit(
    report({
      picomatch: {
        severity: "high",
        via: [{ ...advisory, url: "https://github.com/advisories/GHSA-other" }],
      },
    }),
  );
  assert.deepEqual(outcome.blocking, ["picomatch"]);
});

test("blocks unrelated high and critical advisories", () => {
  const outcome = classifyAudit(
    report({
      another: {
        severity: "critical",
        via: [
          { name: "another", url: "https://github.com/advisories/GHSA-other" },
        ],
      },
      picomatch: { severity: "high", via: [advisory] },
    }),
  );
  assert.deepEqual(outcome, { ignored: ["picomatch"], blocking: ["another"] });
});

test("blocks a mixed downstream dependency", () => {
  const outcome = classifyAudit(
    report({
      picomatch: { severity: "high", via: [advisory] },
      other: {
        severity: "high",
        via: [{ name: "other", url: "https://github.com/advisories/GHSA-other" }],
      },
      downstream: { severity: "high", via: ["picomatch", "other"] },
    }),
  );
  assert.deepEqual(outcome.blocking, ["other", "downstream"]);
});

test("fails closed on malformed audit reports or unknown via dependencies", () => {
  assert.throws(() => classifyAudit({ error: "network failure" }));
  assert.deepEqual(
    classifyAudit(
      report({
        downstream: { severity: "high", via: ["missing"] },
      }),
    ).blocking,
    ["downstream"],
  );
});
