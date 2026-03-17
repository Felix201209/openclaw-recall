# Operations

CLI reference, configuration, and runtime metrics for OpenClaw Recall.

---

## Operator CLI Reference

```bash
# Health
openclaw-recall doctor
openclaw-recall status

# Config
openclaw-recall config show
openclaw-recall config validate
openclaw-recall config init

# Import / Export
openclaw-recall import dry-run
openclaw-recall import run
openclaw-recall import status
openclaw-recall export memory
openclaw-recall export profile
openclaw-recall export session --session <sessionId>

# Memory
openclaw-recall memory list
openclaw-recall memory inspect <id>
openclaw-recall memory search "<query>"
openclaw-recall memory explain "<query>"
openclaw-recall memory prune-noise [--dry-run]
openclaw-recall memory reindex [--dry-run]
openclaw-recall memory compact [--dry-run]

# Profile & Session
openclaw-recall profile list
openclaw-recall profile inspect <runId>
openclaw-recall session list
openclaw-recall session inspect <sessionId>

# Backend
openclaw-recall backend serve
```

---

## Configuration

### Defaults

| Setting | Default |
|---|---|
| Embeddings | Local hashed |
| Context budget | `2400` tokens |
| Recent-turn window | `6` turns |
| Preference TTL | Long |
| Episodic TTL | Short |
| Automatic memory write | Enabled |
| Detailed profiles | Enabled |

### Precedence

1. `OPENCLAW_RECALL_*` environment variables
2. `plugins.entries.openclaw-recall.config`
3. Built-in defaults

Legacy `OPENCLAW_MEMORY_PLUGIN_*` variables are accepted as compatibility aliases during the rename transition.

### Identity Variables

```
OPENCLAW_RECALL_IDENTITY_MODE
OPENCLAW_RECALL_IDENTITY_KEY
OPENCLAW_RECALL_MEMORY_SPACE_ID
OPENCLAW_RECALL_IDENTITY_API_KEY
OPENCLAW_RECALL_IDENTITY_ENDPOINT
OPENCLAW_RECALL_EXPORT_DIRECTORY
```

---

## Memory Hygiene

If you have old noisy rows, run:

```bash
openclaw-recall memory prune-noise --dry-run   # preview what will be removed
openclaw-recall memory prune-noise             # execute
openclaw-recall memory reindex --dry-run
openclaw-recall memory reindex
openclaw-recall memory compact --dry-run
openclaw-recall memory compact
```

### What `status` reports

`noisyActiveMemoryCount` · `lastPrune` · `lastReindex` · `lastCompact` · `hygiene` · `recentImportStats` · `lastExportPath`

### What `memory explain` exposes

`retrievalMode` · selected rows with `finalScore` · `keywordContribution` · `semanticContribution` · suppressed noisy rows with suppression reasons

Debug data stays in inspect paths only — normal chat replies remain clean.

---

## Metric Accuracy

| Metric | Source |
|---|---|
| `promptTokensSource` | `exact` when provider usage metadata is available; `estimated` otherwise |
| `compressionSavingsSource` | `estimated` (heuristic comparison) |
| `toolTokensSavedSource` | `estimated` (heuristic comparison) |

OpenClaw Recall does not pretend every number is exact. Savings figures are heuristic comparisons and should be treated as directional, not precise.
