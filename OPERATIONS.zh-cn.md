# 运维参考

OpenClaw Recall 的命令行速查、配置说明与运行时数据精度。

---

## 命令行速查

```bash
# 健康检查
openclaw-recall doctor
openclaw-recall status

# 配置
openclaw-recall config show
openclaw-recall config validate
openclaw-recall config init

# 导入 / 导出
openclaw-recall import dry-run
openclaw-recall import run
openclaw-recall import status
openclaw-recall export memory
openclaw-recall export profile
openclaw-recall export session --session <sessionId>

# 记忆管理
openclaw-recall memory list
openclaw-recall memory inspect <id>
openclaw-recall memory search "<查询词>"
openclaw-recall memory explain "<查询词>"
openclaw-recall memory prune-noise [--dry-run]
openclaw-recall memory reindex [--dry-run]
openclaw-recall memory compact [--dry-run]

# Profile 与 Session
openclaw-recall profile list
openclaw-recall profile inspect <runId>
openclaw-recall session list
openclaw-recall session inspect <sessionId>

# 后端
openclaw-recall backend serve
```

---

## 配置说明

### 默认值

| 配置项 | 默认值 |
|---|---|
| 向量嵌入方式 | 本地哈希嵌入 |
| 上下文预算 | `2400` tokens |
| 近期轮次窗口 | `6` 轮 |
| 偏好类记忆 TTL | 较长 |
| 情节类记忆 TTL | 较短 |
| 自动记忆写入 | 开启 |
| 详细 profile | 开启 |

### 优先级顺序

1. `OPENCLAW_RECALL_*` 环境变量
2. `plugins.entries.openclaw-recall.config`
3. 内置默认值

旧版 `OPENCLAW_MEMORY_PLUGIN_*` 变量在改名过渡期间仍作为兼容别名接受。

### 身份相关环境变量

```
OPENCLAW_RECALL_IDENTITY_MODE
OPENCLAW_RECALL_IDENTITY_KEY
OPENCLAW_RECALL_MEMORY_SPACE_ID
OPENCLAW_RECALL_IDENTITY_API_KEY
OPENCLAW_RECALL_IDENTITY_ENDPOINT
OPENCLAW_RECALL_EXPORT_DIRECTORY
```

---

## 记忆卫生

如果存在旧的噪声记忆行，执行：

```bash
openclaw-recall memory prune-noise --dry-run   # 预演，看哪些会被清理
openclaw-recall memory prune-noise             # 实际执行清理
openclaw-recall memory reindex --dry-run
openclaw-recall memory reindex
openclaw-recall memory compact --dry-run
openclaw-recall memory compact
```

### `status` 报告字段
`noisyActiveMemoryCount` · `lastPrune` · `lastReindex` · `lastCompact` · `hygiene` · `recentImportStats` · `lastExportPath`

### `memory explain` 暴露字段
`retrievalMode` · 选中行及 `finalScore` · `keywordContribution` · `semanticContribution` · 被抑制的噪声行及抑制原因

调试数据仅出现在检查路径中，正常对话回复保持干净。

---

## 数据精度说明

| 指标 | 来源 |
|---|---|
| `promptTokensSource` | Provider 提供用量元数据时为 `exact`，否则为 `estimated` |
| `compressionSavingsSource` | `estimated`（启发式对比） |
| `toolTokensSavedSource` | `estimated`（启发式对比） |

OpenClaw Recall 不对每个数字的精确性作出保证。节省量数据为启发式对比结果，应视为方向性参考而非精确值。
