# Architecture

Internal design, component overview, and memory quality guardrails for OpenClaw Recall.

---

## Memory Quality Guardrails

OpenClaw Recall treats memory quality as a first-class runtime concern. Guardrails operate at both write time and retrieval time.

### Write-time filters reject:
- Sender metadata, cron/heartbeat records, control-plane labels
- Wrapper text, debug annotations, scaffold fragments
- Low-value emotion-only lines

### Retrieval-time suppression prevents:
- Old noisy rows dominating recall
- Stale or superseded rows crowding out current memory
- Internal wrapper/debug text leaking into normal answers

### Stable preference extraction favors:
`偏直接` · `偏执行导向` · `偏中文` · `偏简洁` · structured reporting preferences

### Conflict handling supports:
- Stable preference supersession
- Common fact updates
- Reduction of long-term recall pollution from stale rows

---

## Retrieval Design

Hybrid retrieval uses RRF-style fusion to balance three signal sources:

1. **Stable preferences** — long-lived user preferences that should survive across sessions
2. **Project context** — current project state and task definitions
3. **Active task/session context** — what's happening right now

Additional mechanisms:
- **Candidate-pool expansion** — widens the initial candidate set before re-ranking
- **MMR-style diversification** — reduces duplicate preference-heavy results
- **Retrieval gate** — skips memory work entirely for command-like prompts where recall adds no value
- **Relation-aware stitching** — reconstructs project/task memory relationships after import or restore

---

## Compaction Design

Tool output compaction preserves structure that matters:
- Commands and their outputs
- Error stacks
- Code blocks
- Semi-structured sections (key/value, tables, headers)

Provider-style wrapper payloads are unwrapped before compaction so the compacted result reflects useful text rather than JSON shells.

---

## Import Design

Long-form import chunks oversized memories and transcript segments so signal is distributed across retrievable units rather than buried in a single large blob.

Import quality controls:
- `rejectedNoise` — content filtered as noise
- `rejectedSensitive` — content filtered for sensitivity
- `uncertainCandidates` — content flagged for manual review

Generic imports do not silently promote semantic memory into `shared` scope. Exported plugin artifacts preserve their stored scope metadata on re-import.

---

## Memory Types

| Type | TTL | Purpose |
|---|---|---|
| `preference` | Long | Stable user preferences (name, language, style) |
| `semantic` | Medium | Factual and domain knowledge |
| `episodic` | Short | What happened in recent sessions |
| `session_state` | Session | Active task and context state |

---

## Prompt Budget

- Default context budget: `2400` tokens
- Recent-turn window: `6` turns
- History summarization activates once the turn-count threshold is crossed
- Budget enforcement is hard — Recall will not exceed the configured budget

---

## Metric Sources

- `promptTokensSource=exact` when provider usage metadata is available
- `promptTokensSource=estimated` when it is not
- `compressionSavingsSource=estimated` — heuristic comparison
- `toolTokensSavedSource=estimated` — heuristic comparison
