# Contributing

Build, test, and verification guide for OpenClaw Recall.

---

## Prerequisites

- Node.js `24.10.0` or `24.12.0`
- OpenClaw `2026.3.13`

---

## Build

```bash
npm install
npm run build
```

---

## Verification

Run the full verification suite before submitting a PR:

```bash
npm run check
npm run build
npm run test:unit
npm run test:integration
npm run test:remote-roundtrip
npm run test:install
npm run smoke
npm run verify
```

For release packaging:

```bash
npm run release:build
```

---

## Test Coverage

| Command | What it covers |
|---|---|
| `test:unit` | Core memory write, retrieval, and compaction logic |
| `test:integration` | Plugin install, config init, import/export flows |
| `test:remote-roundtrip` | Identity reconnect and memory space continuity |
| `test:install` | Source-link and tarball install paths |
| `smoke` | End-to-end health check against a live OpenClaw instance |

---

## Compatibility

Verified on Node.js `24.10.0` and `24.12.0`, OpenClaw `2026.3.13`, OpenAI Responses runtime.

See [COMPATIBILITY.md](COMPATIBILITY.md) for the full matrix before opening a compatibility-related issue.
