# Release Notes

## v0.2.0

Initial release candidate for `openclaw-memory-plugin`.

### What it solves

- stable user preferences are no longer lost between sessions
- prompt construction avoids replaying the full transcript
- large tool payloads are compacted before re-entering the prompt path
- prompt and retrieval behavior become inspectable through profiles and operator commands

### Core capabilities

- automatic memory write for `preference`, `semantic`, `episodic`, and `session_state`
- cross-session memory retrieval before prompt build
- layered context compression with budget enforcement
- tool output compaction with savings reporting
- operator CLI for doctor, status, memory, profile, session, and config inspection
- plugin inspect routes inside OpenClaw

### Verified in this release

- Node.js `24.12.0`
- OpenClaw npm package `2026.3.13`
- OpenAI Responses runtime path with mocked provider usage for exact prompt token counts
- local hashed embeddings by default
- install from source link and install from generated tarball

### Known limitations

- prompt token counts can be `exact` when provider usage is available, but compression and tool savings are still `estimated`
- OpenClaw plugin metadata can advertise CLI commands, but the supported operator surface remains the standalone `openclaw-memory-plugin` binary
- OpenAI-compatible embeddings are supported but not covered by the automated smoke path in this release

### Install

```bash
npm install
npm run build
openclaw plugins install --link .
openclaw-memory-plugin doctor
openclaw-memory-plugin status
```

For a release-grade validation path:

```bash
npm run verify
```
