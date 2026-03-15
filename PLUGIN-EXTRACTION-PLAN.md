# Plugin Extraction Plan

This repository was extracted from the earlier NovaClaw prototype. The goal of extraction was to keep the reusable enhancement logic and discard the replacement-product shell.

| NovaClaw source path | Plugin destination path | Action | Reason | Dependency risk |
| --- | --- | --- | --- | --- |
| `src/memory/memory_extractor/MemoryExtractor.ts` | `src/memory/MemoryExtractor.ts` | adapt | core automatic memory extraction logic | low |
| `src/memory/memory_store/MemoryStore.ts` | `src/memory/MemoryStore.ts` | adapt | persistent memory write, dedupe, supersede | medium |
| `src/memory/memory_retriever/MemoryRetriever.ts` | `src/memory/MemoryRetriever.ts` | adapt | query-aware retrieval is plugin core | low |
| `src/memory/memory_ranker/MemoryRanker.ts` | `src/memory/MemoryRanker.ts` | copy | retrieval scoring is reusable as-is | low |
| `src/memory/embeddings/EmbeddingProvider.ts` | `src/memory/EmbeddingProvider.ts` | adapt | plugin needs provider-agnostic embeddings | low |
| `src/state/session_state_store/SessionStateStore.ts` | `src/memory/SessionStateStore.ts` | adapt | session state belongs inside plugin layer | low |
| `src/runtime/context_compressor/ContextCompressor.ts` | `src/compression/ContextCompressor.ts` | adapt | compression remains plugin core | low |
| `src/runtime/prompt_builder/PromptBuilder.ts` | `src/compression/PromptBuilder.ts` | adapt | prompt injection moved behind hooks | low |
| `src/runtime/budget_manager/BudgetManager.ts` | `src/compression/BudgetManager.ts` | copy | budget fit logic stays reusable | low |
| `src/tools/tool_output_compactor/ToolOutputCompactor.ts` | `src/compression/ToolOutputCompactor.ts` | adapt | compaction belongs inside tool lifecycle hooks | low |
| `src/tools/tool_output_store/ToolOutputStore.ts` | `src/compression/ToolOutputStore.ts` | adapt | plugin needs compacted tool persistence | low |
| `src/profile/TurnProfileStore.ts` | `src/profiling/TurnProfileStore.ts` | adapt | plugin requires per-run inspectability | low |
| `src/memory/event_store/EventStore.ts` | `src/profiling/EventStore.ts` | adapt | transcript/session summary storage remains useful | low |
| `src/storage/NovaClawDatabase.ts` | `src/storage/PluginDatabase.ts` | adapt | database moved from app storage to plugin storage | medium |
| `src/types/domain.ts` | `src/types/domain.ts` | adapt | shared types trimmed to plugin scope | low |
| `src/shared/text.ts` | `src/shared/text.ts` | copy | token estimation and text helpers remain reusable | low |
| `src/shared/messages.ts` | `src/shared/messages.ts` | adapt | plugin needs runtime message normalization | medium |
| `src/shared/fileStore.ts` | `src/shared/fileStore.ts` | copy | lightweight file utilities remain reusable | low |
| `src/runtime/openclaw/OpenClawRuntimeAdapter.ts` | `src/plugin/hooks.ts` + `src/plugin/index.ts` | adapt | replacement runtime removed; hooks retained | medium |
| `src/tui/NovaClawTui.ts` | discarded | discard | plugin strategy does not own terminal product shell | none |
| `src/tui/OpenClawDerivedTui.ts` | discarded | discard | plugin strategy does not ship a replacement TUI | none |
| `src/app/api/routes.ts` | `src/inspect/http.ts` | adapt | keep only plugin inspect surface, not full app API | low |
| `src/server.ts` | discarded | discard | plugin does not run a standalone product server | none |
| `public/index.html` | discarded | discard | plugin does not replace OpenClaw web UI | none |
| `ported/openclaw/*` | discarded | discard | full product-layer parity work is no longer the target | none |

## Extraction decision

Retained:

- memory
- compression
- profiling
- transcript/session inspection
- OpenClaw runtime integration logic

Discarded:

- full replacement CLI
- replacement TUI
- replacement Web UI
- product parity asset trees

Result:

The new repository focuses only on the enhancement layer that is meaningful as an OpenClaw plugin.
