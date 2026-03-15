# Operations

## Quick checks

```bash
openclaw-memory-plugin doctor
openclaw-memory-plugin status
openclaw-memory-plugin memory list
openclaw-memory-plugin profile list
```

## What `doctor` checks

- OpenClaw config presence
- plugin enablement
- database path, writability, and SQLite query health
- embedding availability
- inspect route path
- package/plugin manifest integrity
- build integrity
- env/config precedence warnings
- recent hook activity
- memory pipeline activity
- retrieval pipeline activity
- compression pipeline activity
- recent tool compaction evidence
- recent profile path integrity

## Debugging memory behavior

Search:

```bash
openclaw-memory-plugin memory search "concise chinese replies"
```

Explain retrieval:

```bash
openclaw-memory-plugin memory explain "你记得我的偏好吗？"
openclaw-memory-plugin session inspect <sessionId>
```

Inspect one row:

```bash
openclaw-memory-plugin memory inspect <id>
```

## Debugging profile/compression behavior

```bash
openclaw-memory-plugin profile list
openclaw-memory-plugin profile inspect <runId>
```

Look for:

- `promptTokens`
- `promptTokensSource`
- `memoryInjected`
- `toolTokensSaved`
- `toolTokensSavedSource`
- `compressionSavings`
- `compressionSavingsSource`
- `retrievalCount`

If `promptTokensSource=exact`, the provider reported real usage. Savings values remain `estimated` until a provider-native tokenizer path is added.

## Inspect HTTP surface

Use the authenticated OpenClaw route:

- `/plugins/openclaw-memory-plugin/dashboard`
- `/plugins/openclaw-memory-plugin/status`
- `/plugins/openclaw-memory-plugin/sessions/:sessionId`

## Recovery

### Disable the plugin temporarily

```bash
openclaw plugins disable openclaw-memory-plugin
```

### Disable automatic memory writes only

Keep the plugin loaded but stop persisting new memories:

```bash
OPENCLAW_MEMORY_PLUGIN_AUTO_WRITE=false
```

This still allows retrieval, tool compaction, inspect routes, and profile recording.

### Re-enable

```bash
openclaw plugins enable openclaw-memory-plugin
```

### Remove plugin state only

Delete the plugin state directory under:

```text
$OPENCLAW_HOME/.openclaw/plugins/openclaw-memory-plugin/
```

This clears stored memories, profiles, and tool compactions for the plugin only.

### Remove one session's recorded data

Use the standalone CLI to inspect sessions via the dashboard or remove rows manually from the plugin SQLite database if you are doing a recovery task. Session state, transcript rows, tool outputs, and turn profiles are scoped by `session_id`.

### Export debug evidence

```bash
openclaw-memory-plugin doctor --json > doctor.json
openclaw-memory-plugin status --json > status.json
openclaw-memory-plugin session inspect <sessionId> --json > session.json
openclaw-memory-plugin profile inspect <runId> --json > profile.json
```

## SQLite notes

The plugin uses SQLite with:

- `foreign_keys = ON`
- `busy_timeout = 5000`
- `journal_mode = WAL` when available

If another long-running process is holding the database, operator commands should wait briefly instead of failing immediately.

## Disabling inspection surface

Change:

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "config": {
          "inspect": {
            "httpPath": "/plugins/openclaw-memory-plugin"
          }
        }
      }
    }
  }
}
```

to a different path, or disable the plugin entirely.
