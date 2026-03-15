# OpenClaw Memory + Context Plugin

Production-grade enhancement plugin for OpenClaw that adds persistent memory, token-efficient context construction, tool output compaction, and inspectable prompt profiling.

This repository is not an OpenClaw replacement product. It is an installable plugin package that attaches to OpenClaw's existing runtime, hook system, prompt pipeline, and tool lifecycle.

## What it adds

- Automatic memory writes after each turn
- Cross-session memory retrieval before prompt build
- Structured memory types: `preference`, `semantic`, `episodic`, `session_state`
- Layered context compression:
  - task state
  - relevant memory
  - compacted tool output
  - older history summary
  - recent turn window
- Tool output compaction for large payloads
- Prompt/profile inspection:
  - estimated prompt size
  - retrieval count
  - compaction savings
  - trim/compression events

## Repository boundaries

This plugin intentionally does not ship a replacement CLI, TUI, or Web UI for OpenClaw. It extends OpenClaw itself and provides:

- an installable OpenClaw plugin entry
- a standalone operator CLI: `openclaw-memory-plugin`
- a small inspect surface under an authenticated OpenClaw HTTP route

## Install

### Option A: local development link

```bash
git clone https://github.com/Felix201209/openclaw-memory-plugin.git
cd openclaw-memory-plugin
npm install
npm run build
openclaw plugins install --link .
```

### Option B: npm install after publish

This package is release-ready, but this repository does not claim that the npm package is already published. After publish, the install flow will be:

```bash
npm install openclaw-memory-plugin
openclaw plugins install openclaw-memory-plugin
```

## Enable and configure

`openclaw plugins install` writes the loader path into your OpenClaw config. The plugin entry then lives under:

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "hooks": {
          "allowPromptInjection": true
        },
        "config": {
          "memory": {
            "topK": 6,
            "bootTopK": 4
          },
          "compression": {
            "recentTurns": 6,
            "contextBudget": 2400,
            "historySummaryThreshold": 6,
            "toolCompactionThresholdChars": 600
          }
        }
      }
    }
  }
}
```

Environment overrides are supported through `.env` or process env:

```bash
OPENCLAW_MEMORY_PLUGIN_EMBEDDING_PROVIDER=local
OPENCLAW_MEMORY_PLUGIN_CONTEXT_BUDGET=2400
OPENCLAW_MEMORY_PLUGIN_RECENT_TURNS=6
OPENCLAW_MEMORY_PLUGIN_MEMORY_TOP_K=6
OPENCLAW_MEMORY_PLUGIN_BOOT_TOP_K=4
OPENCLAW_MEMORY_PLUGIN_HTTP_PATH=/plugins/openclaw-memory-plugin
```

See [`.env.example`](/Users/felix/Documents/openclaw-memory-plugin/.env.example) and [OPENCLAW-INTEGRATION.md](/Users/felix/Documents/openclaw-memory-plugin/OPENCLAW-INTEGRATION.md).

## Verify it is working

### 1. Confirm OpenClaw can see the plugin

```bash
openclaw plugins info openclaw-memory-plugin
```

### 2. Run operator checks

```bash
openclaw-memory-plugin status
openclaw-memory-plugin doctor
openclaw-memory-plugin memory list
openclaw-memory-plugin profile list
```

### 3. Inspect the plugin route

By default the plugin exposes:

- `/plugins/openclaw-memory-plugin/dashboard`
- `/plugins/openclaw-memory-plugin/status`
- `/plugins/openclaw-memory-plugin/memories`
- `/plugins/openclaw-memory-plugin/profiles`
- `/plugins/openclaw-memory-plugin/sessions`

These routes are registered through OpenClaw and use `auth: "plugin"`.

## Standalone plugin CLI

This repository intentionally ships its own operator CLI instead of trying to replace the OpenClaw CLI.

```bash
openclaw-memory-plugin doctor
openclaw-memory-plugin status
openclaw-memory-plugin memory list
openclaw-memory-plugin memory inspect <id>
openclaw-memory-plugin memory search "<query>"
openclaw-memory-plugin memory explain "<query>"
openclaw-memory-plugin profile list
openclaw-memory-plugin profile inspect <runId>
openclaw-memory-plugin config show
```

## Default policy

### Memory write policy

- `preference`: long-lived, high priority
- `semantic`: stable user/project facts
- `session_state`: current task, constraints, decisions, open questions
- `episodic`: short TTL references and recent events

Automatic writes happen after each agent turn:

```text
assistant turn complete
-> candidate extraction
-> classification
-> importance scoring
-> dedupe / conflict handling
-> memory write + state patch
-> profile record
```

### Compression policy

Prompt assembly is fixed into these layers:

1. `SYSTEM`
2. `TASK STATE`
3. `RELEVANT MEMORY`
4. `COMPRESSED TOOL OUTPUT`
5. `OLDER HISTORY SUMMARY`
6. `RECENT TURNS`
7. `CURRENT USER MESSAGE`

Trim priority favors preserving system instructions and the current message.

## Storage

All plugin data lives under OpenClaw's isolated state directory:

```text
$OPENCLAW_HOME/.openclaw/plugins/openclaw-memory-plugin/
```

Main artifacts:

- `memory.sqlite`
- memory rows
- tool compaction rows
- session state
- recorded turn profiles

## Development

```bash
npm install
npm run check
npm run build
npm run test:integration
npm run test:install
npm run release:build
```

`npm run release:build` produces a tarball in `./.release/`.

## Attribution

This plugin uses OpenClaw's published plugin/runtime integration model and targets the OpenClaw plugin SDK. The enhancement logic in this repository was extracted and adapted from the earlier NovaClaw prototype work. See:

- [ARCHITECTURE.md](/Users/felix/Documents/openclaw-memory-plugin/ARCHITECTURE.md)
- [OPENCLAW-INTEGRATION.md](/Users/felix/Documents/openclaw-memory-plugin/OPENCLAW-INTEGRATION.md)
- [PLUGIN-EXTRACTION-PLAN.md](/Users/felix/Documents/openclaw-memory-plugin/PLUGIN-EXTRACTION-PLAN.md)
- [NOTICE](/Users/felix/Documents/openclaw-memory-plugin/NOTICE)
- [THIRD_PARTY_NOTICES.md](/Users/felix/Documents/openclaw-memory-plugin/THIRD_PARTY_NOTICES.md)
