# Security Policy

## Supported Versions

Only the latest release series receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

The preferred method is [GitHub Private Vulnerability Reporting](https://github.com/fenril058/compile-battle-stats/security/advisories/new). Alternatively, report by emailing **fenril.nh@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce or proof-of-concept (if available)
- The version(s) affected

You can expect an acknowledgement within 3 business days. If the vulnerability is confirmed, a fix will be prioritised and you will be credited in the release notes (unless you prefer to remain anonymous).

## Scope

This is a personal statistics tracker for a card game. The main security considerations are:

- **Firebase Firestore rules** — match data is user-scoped; rules are defined outside this repository in the Firebase console
- **Authentication** — handled entirely by Firebase Authentication; no credentials are stored in this codebase
- **Client-side secrets** — Firebase API keys are injected at build time via environment variables (`.env` is not committed). They are public-facing by design once bundled (they identify the project, not grant admin access); the real access boundary is Firestore security rules
- **LocalStorage mode** — data stays in the browser and is never transmitted when Firebase is not configured

Out of scope: vulnerabilities in Firebase / Google infrastructure itself (report those to Google).
