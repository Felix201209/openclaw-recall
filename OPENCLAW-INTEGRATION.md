# OpenClaw Integration

## Integration shape

This package integrates with OpenClaw as a normal plugin package. It does not patch OpenClaw source files and does not require modifying the installed OpenClaw package.

Primary integration method:

- `openclaw plugins install --link /path/to/openclaw-memory-plugin`

OpenClaw then records:

- plugin load path
- per-plugin enablement
- install metadata

in `openclaw.json`.

## Install flow

### Local path install

```bash
cd /path/to/openclaw-memory-plugin
npm install
npm run build
openclaw plugins install --link .
```

### Verify discovery

```bash
openclaw plugins info openclaw-memory-plugin
openclaw plugins doctor
```

## Config path and state path

If `OPENCLAW_HOME=/path/root`, OpenClaw uses:

```text
/path/root/.openclaw/openclaw.json
```

The plugin stores its runtime data under:

```text
/path/root/.openclaw/plugins/openclaw-memory-plugin/
```

## Config precedence

Resolution order:

1. environment variables `OPENCLAW_MEMORY_PLUGIN_*`
2. `plugins.entries.openclaw-memory-plugin.config`
3. defaults from [`src/config/defaults.ts`](/Users/felix/Documents/openclaw-memory-plugin/src/config/defaults.ts)

## Hook behavior

### `before_prompt_build`

- load session state
- retrieve boot memory + relevant memory
- compress old history
- assemble injected prompt layers

### `after_tool_call`

- compact tool output
- store summary + raw payload reference

### `tool_result_persist`

- replace large tool payload with compacted text in the persisted message path

### `agent_end`

- store transcript turns
- extract and write new memories
- update session state
- record turn profile

## Enable / disable

Enable:

```bash
openclaw plugins enable openclaw-memory-plugin
```

Disable:

```bash
openclaw plugins disable openclaw-memory-plugin
```

Uninstall:

```bash
openclaw plugins uninstall openclaw-memory-plugin
```

## Inspect route

Default path:

```text
/plugins/openclaw-memory-plugin
```

Endpoints:

- `/dashboard`
- `/status`
- `/memories`
- `/memories/:id`
- `/profiles`
- `/profiles/:runId`
- `/sessions`

## Known limitations

- The operational CLI for this plugin is the standalone `openclaw-memory-plugin` binary. OpenClaw plugin metadata can advertise CLI commands, but current OpenClaw command parsing does not expose the plugin's command tree as a top-level `openclaw` subcommand during early argument parsing.
- Embeddings default to local hashed vectors to avoid forcing external dependencies. OpenAI-compatible embeddings are optional.
- Token budgeting uses estimate-based token accounting rather than provider-native tokenizer APIs.
