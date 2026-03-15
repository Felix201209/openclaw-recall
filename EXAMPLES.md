# Examples

## 5-minute walkthrough

### 1. Teach a stable preference

User message:

```text
以后默认叫我 Felix，用中文回答，并且尽量简洁。
```

Expected plugin behavior:

- writes `preference` memory rows
- stores no full replay requirement for later sessions

### 2. Start a new session and ask for recall

User message:

```text
你记得我的偏好吗？
```

Expected behavior:

- plugin retrieves prior preference memories
- prompt build injects `RELEVANT MEMORY`
- assistant can answer without full transcript replay
- resulting profile should show `promptTokensSource: "exact"` on provider paths that return usage

Example output from the repository demo:

```text
我记得：• [preference] User prefers to be addressed as Felix，用中文回答，并且尽量简洁。. (score=18.34; importance=9.2; why=high-value memory type, high confidence for "你记得我的偏好吗？".)
```

### 3. Trigger a large tool payload

User message:

```text
read "README.md"
```

Expected behavior:

- raw payload is compacted
- profile records `toolTokensSaved`
- stored tool output remains inspectable
- `toolTokensSavedSource` remains `estimated`, not fake-exact

Example result excerpt:

```text
Read complete. # Plugin Smoke Workspace This file exists to exercise OpenClaw tool execution and force compaction savings...
```

### 4. Inspect what happened

```bash
openclaw-memory-plugin memory list
openclaw-memory-plugin memory explain "你记得我的偏好吗？"
openclaw-memory-plugin profile list
openclaw-memory-plugin session inspect plugin-smoke-3
```

Success indicators:

- `memory list` contains preference rows mentioning Felix / Chinese / concise
- `memory explain` gives a ranked reason for retrieval
- `profile list --json` shows at least one run with `promptTokensSource: "exact"`
- `session inspect` shows tool results with `savedTokens > 0`

## Sample status output

```json
{
  "enabled": true,
  "memoryCount": 3,
  "profileCount": 3,
  "sessionCount": 3,
  "recentRetrievalCount": 3,
  "recentCompressionSavings": 207,
  "recentMemoryWrites": 0,
  "latestProfile": {
    "promptTokensSource": "exact",
    "compressionSavingsSource": "estimated"
  }
}
```

## Sample doctor signals

Healthy plugin:

- plugin enabled
- database path exists and is writable
- embedding provider available
- recent hook activity present
- memory pipeline active
- retrieval pipeline active
- compression pipeline active

Uninitialized plugin:

- no recent profile data yet
- no memories stored yet
- no compacted tool outputs yet

That state is normal before the first real conversation.
