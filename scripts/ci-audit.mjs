import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Temporary exception for the unpatched picomatch ReDoS advisory, currently
// present only in dev dependencies. The production audit remains blocking.
// Remove this exception once a patched picomatch release is available.
const ALLOWED_ADVISORY = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);

export function classifyAudit(report) {
  if (
    !report ||
    report.auditReportVersion !== 2 ||
    !report.metadata?.vulnerabilities ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== 'object'
  ) {
    throw new Error('npm audit did not return a valid v2 vulnerability report');
  }

  const vulnerabilities = report.vulnerabilities;
  const tracedToAllowedAdvisory = (name, visited = new Set()) => {
    const vulnerability = vulnerabilities[name];
    if (!vulnerability || visited.has(name) || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
      return false;
    }
    const next = new Set(visited).add(name);
    return vulnerability.via.every((source) => {
      if (typeof source === 'string') {
        return tracedToAllowedAdvisory(source, next);
      }
      return source?.name === 'picomatch' && source.url === ALLOWED_ADVISORY;
    });
  };

  const ignored = [];
  const blocking = [];
  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!BLOCKING_SEVERITIES.has(vulnerability.severity)) continue;
    (tracedToAllowedAdvisory(name) ? ignored : blocking).push(name);
  }
  return { ignored, blocking };
}

function main() {
  const result = spawnSync('npm', ['audit', '--json', '--audit-level=high'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    throw new Error(`npm audit could not run: ${result.error?.message ?? result.stderr ?? result.status}`);
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(`npm audit returned invalid JSON: ${result.stderr || result.stdout.slice(0, 500)}`);
  }
  if (report.error) {
    throw new Error(`npm audit error: ${JSON.stringify(report.error)}`);
  }
  const { ignored, blocking } = classifyAudit(report);
  if (ignored.length) {
    console.warn(`::warning::Temporarily allowing ${ALLOWED_ADVISORY} in dev dependencies (affected packages: ${ignored.join(', ')})`);
  }
  if (blocking.length) {
    console.error(`::error::High/critical dependency vulnerabilities outside the exception: ${blocking.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('Dependency audit passed: no other high/critical vulnerabilities.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
