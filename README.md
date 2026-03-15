# OpenClaw Memory + Context Plugin

Production-grade enhancement plugin for OpenClaw that adds persistent memory, token-efficient context construction, tool output compaction, and inspectable prompt profiling.

This repository is not an OpenClaw replacement product. It extends OpenClaw's existing runtime and product surface through plugin hooks.

## Why install it

OpenClaw already has a mature runtime. This plugin strengthens the parts that most directly affect long-running agent quality:

- models stop forgetting stable user preferences
- cross-session continuity improves
- raw history replay is reduced
- large tool output stops bloating prompts
- prompt construction becomes inspectable instead of opaque

In practical terms, after installing this plugin you get:

- fewer repeated instructions across sessions
- lower prompt waste from old transcript and tool payloads
- better task continuity
- concrete profiling data for retrieval and compression behavior

## What it adds

- Automatic memory writes after each agent turn
- Query-aware memory retrieval before prompt build
- Structured memory types:
  - `preference`
  - `semantic`
  - `episodic`
  - `session_state`
- Layered context construction:
  - `TASK STATE`
  - `RELEVANT MEMORY`
  - `COMPRESSED TOOL OUTPUT`
  - `OLDER HISTORY SUMMARY`
  - `RECENT TURNS`
- Tool output compaction for large payloads
- Prompt/profile inspection:
  - prompt size
  - retrieval count
  - memory writes
  - tool savings
  - compression savings
  - trim/context details

## 5-minute quickstart

```bash
git clone https://github.com/Felix201209/openclaw-memory-plugin.git
cd openclaw-memory-plugin
npm install
npm run build
openclaw plugins install --link .
openclaw plugins info openclaw-memory-plugin
openclaw-memory-plugin doctor
openclaw-memory-plugin status
npm run demo
```

If you only want the shortest verification path:

```bash
npm install
npm run smoke
```

That path checks:

- type-check/build
- unit tests
- embedded integration flow
- install flow through `openclaw plugins install --link`

Full setup details are in [QUICKSTART.md](/Users/felix/Documents/openclaw-memory-plugin/QUICKSTART.md).

## Smallest demo

This repository includes a scripted demo:

```bash
npm run demo
```

What it shows:

1. user teaches a preference
2. plugin stores it automatically
3. a new session recalls it
4. a tool read gets compacted
5. profiles show recorded memory/compression artifacts

See [EXAMPLES.md](/Users/felix/Documents/openclaw-memory-plugin/EXAMPLES.md) for a walkthrough and sample outputs.

## Install and enable

### Local development link

```bash
npm install
npm run build
openclaw plugins install --link .
```

### After npm publish

The repository is package-ready. Once published, the install flow becomes:

```bash
npm install openclaw-memory-plugin
openclaw plugins install openclaw-memory-plugin
```

### Confirm OpenClaw sees it

```bash
openclaw plugins info openclaw-memory-plugin
openclaw plugins doctor
```

### Confirm the plugin itself is healthy

```bash
openclaw-memory-plugin doctor
openclaw-memory-plugin status
openclaw-memory-plugin memory list
openclaw-memory-plugin profile list
```

## Operator CLI

This package intentionally ships an operator CLI instead of replacing `openclaw`.

```bash
openclaw-memory-plugin doctor
openclaw-memory-plugin status
openclaw-memory-plugin config show
openclaw-memory-plugin config validate
openclaw-memory-plugin config init
openclaw-memory-plugin memory list
openclaw-memory-plugin memory inspect <id>
openclaw-memory-plugin memory search "<query>"
openclaw-memory-plugin memory explain "<query>"
openclaw-memory-plugin profile list
openclaw-memory-plugin profile inspect <runId>
openclaw-memory-plugin session list
openclaw-memory-plugin session inspect <sessionId>
```

## Inspect surface

The plugin exposes a small authenticated inspect surface inside OpenClaw:

- `/plugins/openclaw-memory-plugin/dashboard`
- `/plugins/openclaw-memory-plugin/status`
- `/plugins/openclaw-memory-plugin/memories`
- `/plugins/openclaw-memory-plugin/profiles`
- `/plugins/openclaw-memory-plugin/sessions`
- `/plugins/openclaw-memory-plugin/sessions/:sessionId`

This is a plugin inspection surface, not a replacement web UI.

## Configuration and defaults

The default strategy is tuned for usefulness without forcing heavy setup:

- local hashed embeddings by default
- preference memory gets longest TTL
- episodic memory decays fastest
- prompt budget defaults to `2400`
- recent turn window defaults to `6`
- older history summary starts once turn count crosses threshold
- verbose per-run profile details are enabled by default

Configuration precedence:

1. `OPENCLAW_MEMORY_PLUGIN_*` environment variables
2. `plugins.entries.openclaw-memory-plugin.config`
3. plugin defaults

See:

- [OPENCLAW-INTEGRATION.md](/Users/felix/Documents/openclaw-memory-plugin/OPENCLAW-INTEGRATION.md)
- [ARCHITECTURE.md](/Users/felix/Documents/openclaw-memory-plugin/ARCHITECTURE.md)
- [OPERATIONS.md](/Users/felix/Documents/openclaw-memory-plugin/OPERATIONS.md)
- [TROUBLESHOOTING.md](/Users/felix/Documents/openclaw-memory-plugin/TROUBLESHOOTING.md)

## Development and verification

```bash
npm run check
npm run build
npm run test:unit
npm run test:integration
npm run test:install
npm run smoke
npm run verify
npm run release:build
```

## Packaging

Release tarballs are produced by:

```bash
npm run release:build
```

The package exports:

- plugin entrypoint
- standalone operator CLI
- types
- docs and notices required for install/use

## Attribution

This plugin targets the OpenClaw plugin SDK and runtime integration model. The enhancement logic in this repository was extracted and adapted from the earlier NovaClaw prototype work rather than continuing as a replacement product.

Relevant docs:

- [PLUGIN-EXTRACTION-PLAN.md](/Users/felix/Documents/openclaw-memory-plugin/PLUGIN-EXTRACTION-PLAN.md)
- [NOTICE](/Users/felix/Documents/openclaw-memory-plugin/NOTICE)
- [THIRD_PARTY_NOTICES.md](/Users/felix/Documents/openclaw-memory-plugin/THIRD_PARTY_NOTICES.md)

## Short roadmap

The current plugin is installable and release-ready. The next highest-value upgrades are:

- tokenizer-exact budgeting
- stronger semantic conflict resolution
- richer inspect dashboards
- user-controlled memory editing
- deeper OpenClaw-native UI surface integration
