# Quickstart

## Goal

Get the plugin installed, enabled, and verified with the fewest moving parts.

## Prerequisites

- Node.js 24+
- OpenClaw installed and working
- local shell access to the machine that runs OpenClaw

## Fast path

```bash
git clone https://github.com/Felix201209/openclaw-memory-plugin.git
cd openclaw-memory-plugin
npm install
npm run build
openclaw plugins install --link .
openclaw plugins info openclaw-memory-plugin
openclaw-memory-plugin doctor
openclaw-memory-plugin status
```

## What each step does

1. `npm install`
   installs plugin dependencies and a local OpenClaw dev dependency for validation.
2. `npm run build`
   produces the plugin entrypoint and standalone CLI in `dist/`.
3. `openclaw plugins install --link .`
   registers the plugin path in your active `openclaw.json`.
4. `openclaw plugins info openclaw-memory-plugin`
   confirms OpenClaw can discover and load it.
5. `openclaw-memory-plugin doctor`
   checks config, storage, embeddings, inspect path, and recent runtime evidence.
6. `openclaw-memory-plugin status`
   shows current memory/profile/session counts and latest run activity.

## Optional: write a starter config entry

Print a starter entry:

```bash
openclaw-memory-plugin config init
```

Merge the starter entry into the active `openclaw.json`:

```bash
openclaw-memory-plugin config init --write-openclaw
```

## Environment overrides

Start from [`.env.example`](/Users/felix/Documents/openclaw-memory-plugin/.env.example).

Most users can stay with defaults. The most common overrides are:

```bash
OPENCLAW_MEMORY_PLUGIN_EMBEDDING_PROVIDER=local
OPENCLAW_MEMORY_PLUGIN_CONTEXT_BUDGET=2400
OPENCLAW_MEMORY_PLUGIN_RECENT_TURNS=6
OPENCLAW_MEMORY_PLUGIN_HTTP_PATH=/plugins/openclaw-memory-plugin
```

## Verify hooks with a short demo

```bash
npm run demo
```

That shows:

- automatic memory write
- cross-session recall
- tool compaction
- profile recording

## Full smoke validation

```bash
npm run smoke
```

This runs:

- type-check
- build
- unit tests
- embedded integration test
- install-path integration test
