# Third-Party Notices

## OpenClaw

- Upstream: https://github.com/openclaw/openclaw
- License: MIT
- Usage in this repository:
  - Integration target for the plugin hook/runtime surface
  - API contracts referenced from `openclaw/plugin-sdk/*`
  - Installation and activation workflow follows OpenClaw plugin conventions

## NovaClaw

- Upstream: https://github.com/Felix201209/NovaClaw
- License: project-owned
- Usage in this repository:
  - Memory extraction, ranking, retrieval, compression, and profiling modules were copied/adapted from NovaClaw and re-scoped into a plugin architecture

## MemOS

- Upstream: https://github.com/MemTensor/MemOS
- License: MIT
- Usage in this repository:
  - `src/memory/RrfFusion.ts` is adapted from `apps/memos-local-openclaw/src/recall/rrf.ts`
  - retrieval-composition and benchmark-structure ideas were selectively adapted for Recall's narrower plugin architecture

## memory-lancedb-pro

- Upstream: https://github.com/win4r/memory-lancedb-pro
- License: MIT (declared in upstream package metadata)
- Usage in this repository:
  - retrieval-gating, long-text chunking, and structural compaction ideas were selectively adapted and reimplemented for Recall
