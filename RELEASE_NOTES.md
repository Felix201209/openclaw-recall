# Release Notes

## OpenClaw Recall v1.3.1

`1.3.1` is a patch release with minor improvements:

- improved `.gitignore` to exclude tarball artifacts
- added v1.4 semantic supersede design document for future development planning
- minor documentation updates

All features and compatibility from v1.3.0 remain unchanged.

---

## OpenClaw Recall v1.3.0

`1.3.0` is a real minor release because it materially improves Recall's hybrid retrieval composition and long-form import quality while keeping the project memory-first. The focus is still practical: better mixed recall, denser `RELEVANT MEMORY`, better preservation of useful imported project signal, and stronger token efficiency without weakening hygiene or output safety.

### Highlights

- RRF-style fusion now strengthens hybrid retrieval so preference, project, and task memories survive together more often
- candidate-pool expansion, MMR-style diversification, and relation-aware stitching continue to reduce duplicate-heavy recall
- `RELEVANT MEMORY` is less duplicate-heavy and more efficient per token
- tool-output compaction still preserves useful structure, including commands, code blocks, wrapper-unwrapped text, and error-rich output
- long-form import now chunks oversized source rows so more project signal survives later recall while noise and sensitive rows remain rejected
- new v1.3 benchmark coverage proves retrieval fusion, import chunking, compaction, and operator behavior more directly

### User-visible benefits

- recall now does a better job of mixing “who the user is”, “what the project is”, and “what the current task is”
- restored/imported project context is less likely to collapse into a single coarse row
- prompts waste less space on duplicate preference summaries
- tool-output compaction keeps more high-value structure per token
- imports are more likely to produce useful later recall instead of just adding rows
- operator surfaces remain honest and inspectable while the memory system gets more selective

### Install

```bash
npm install @felixypz/openclaw-recall
openclaw plugins install --link ./node_modules/@felixypz/openclaw-recall
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

### Compatibility

- verified OpenClaw target: `>=2026.3.13`
- verified Node versions: `24.10.0`, `24.12.0`
- strongest validated provider/runtime path: `openai-responses`
- verified backends: `local` and built-in `recall-http`
- verified install paths: source install, installed-package link, generated tarball, clean consumer remote roundtrip

### Known limitations

- `compressionSavings` and `toolTokensSaved` remain partly `estimated`
- OpenClaw plugin CLI exposure through `openclaw <subcommand>` is still upstream-limited; use `openclaw-recall`
- OpenAI-compatible embeddings are supported but not covered by the strongest release-confidence path
- some OpenClaw install/info flows may emit `plugins.allow is empty` warning noise
- memory conflict resolution remains rule-based
