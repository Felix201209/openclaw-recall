# 贡献指南

OpenClaw Recall 的构建、测试与验证流程。

---

## 环境要求

- Node.js `24.10.0` 或 `24.12.0`
- OpenClaw `2026.3.13`

---

## 构建

```bash
npm install
npm run build
```

---

## 验证

提交 PR 前请跑完整验证套件：

```bash
npm run check
npm run build
npm run test:unit
npm run test:integration
npm run test:remote-roundtrip
npm run test:install
npm run smoke
npm run verify
```

打包发布：

```bash
npm run release:build
```

---

## 测试覆盖范围

| 命令 | 覆盖内容 |
|---|---|
| `test:unit` | 核心记忆写入、召回与压缩逻辑 |
| `test:integration` | 插件安装、config init、导入/导出流程 |
| `test:remote-roundtrip` | identity reconnect 与记忆空间连续性 |
| `test:install` | source-link 和 tarball 安装路径 |
| `smoke` | 针对真实 OpenClaw 实例的端到端健康检查 |

---

## 兼容性

已在 Node.js `24.10.0` 和 `24.12.0`、OpenClaw `2026.3.13`、OpenAI Responses 运行时上验证。

提交兼容性相关 issue 前请先查阅 [COMPATIBILITY.md](COMPATIBILITY.md)。
