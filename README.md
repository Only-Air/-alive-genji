# 双龙余烬：Node.js 主持人-执行者多智能体叙事系统

这是根据附件方案实现的**可运行 MVP**。系统包含两个角色执行者（源氏、半藏）、一个按风险唤醒的主持人、共享世界状态、分阶段人物弧线、短期历史、轻量长期记忆检索、行为护栏、关键节点推进、REST API、SSE 实时事件与浏览器控制台。

> 本项目是非商业同人技术演示。角色与世界观相关权利归各自权利人所有。默认知识库仅用于展示软件架构，并不宣称是完整官方时间线。

## 快速运行

要求 Node.js 20+，**无需安装第三方 npm 包**。

```bash
cd node-narrative-sim
npm test
npm start
```

浏览器打开 `http://localhost:3000`。

也可直接运行终端演示：

```bash
npm run demo
```

## 两种运行模式

### 1. 离线规则模式（默认）

不配置密钥即可运行。角色使用按叙事阶段编写的确定性行为模型，适合验证架构、状态机、护栏和 UI。

### 2. OpenAI-compatible LLM 模式

复制 `.env.example` 中的变量到运行环境（本项目不自动读取 `.env`，避免增加依赖）：

```bash
export LLM_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY=你的密钥
export LLM_MODEL=gpt-4.1-mini
npm start
```

也可指向其他兼容 `/chat/completions` 且支持 JSON object response format 的服务。

## 架构

```text
浏览器 / API 调用
       │
       ▼
NarrativeEngine（唯一状态写入者）
  ├─ ExecutorAgent: Genji
  ├─ ExecutorAgent: Hanzo
  ├─ Guardrails: 硬校验 + 风险评分
  ├─ DirectorAgent: 高风险动作深度审核
  ├─ MemoryStore: 阶段过滤 + 轻量语义相似度
  └─ WorldState: 版本、场景、人物、节点、审计历史
```

### 核心工作流

1. 执行者根据人物档案、当前阶段、最近历史和相关记忆提出结构化动作。
2. 硬校验检查 JSON 形状；风险层检测时代错置、不可逆动作、替他人决策、角色偏离和循环。
3. 低风险动作直接通过；高风险动作按需提交主持人。
4. 主持人批准、修订或驳回，且所有结果进入审计历史。
5. `NarrativeEngine` 只应用白名单状态路径，防止执行者直接篡改另一角色或全局状态。
6. 每两个回合完成一个里程碑并推进下一叙事阶段（MVP 策略，可替换为条件图）。

## API

- `GET /api/health`：模式和模型信息
- `GET /api/state`：当前公开世界状态
- `GET /api/events`：SSE 状态与回合事件
- `POST /api/turn`：执行单回合
- `POST /api/auto`：自动执行 1–20 回合
- `POST /api/reset`：重置世界

单回合示例：

```bash
curl -X POST http://localhost:3000/api/turn \
  -H 'content-type: application/json' \
  -d '{"actor":"genji","direction":"谈及父亲，但不要立即和解"}'
```

也可传入完整 `proposal`，用于测试护栏：

```json
{
  "actor": "genji",
  "proposal": {
    "action": "源氏后退一步",
    "dialogue": "我不会替你决定什么。",
    "intent": "保持边界",
    "emotion": "克制",
    "stateChanges": [{"path":"characters.genji.emotion","value":"克制"}]
  }
}
```

## 与附件目标的对应关系

- 主持人-执行者分层：已实现
- 按风险唤醒主持人：已实现，阈值可配置
- 世界模型与关键节点：已实现
- 短期记忆：回合历史已实现
- 长期记忆：本地语义检索 MVP 已实现；可替换为向量数据库
- 人设与阶段性人物弧：已实现
- 语义/规则护栏：轻量版本已实现
- 叙事停滞干预：记录与接口已预留；当前按回合推进
- GPT 协作者生成 NPC/事件：尚未单独拆分，LLM 模式下可作为后续 `WriterAgent` 增加
- Redis、向量数据库、LangGraph.js：MVP 为零依赖实现，生产版可按下述方向升级

## 生产化建议

1. 将内存状态迁移至 Redis，并用乐观锁维护 `version`。
2. 将 `MemoryStore` 替换为 Qdrant、Chroma 或 pgvector，加入 embedding 与来源字段。
3. 用 LangGraph.js 表达条件边和回滚节点，而不是固定的“两回合推进”。
4. 增加独立 `WriterAgent`，其新增世界事实必须经过主持人批准。
5. 对 LLM 调用增加超时、重试、熔断、令牌预算和可观测性。
6. 将官方事实与同人推断分层存储，记录出处、置信度与时间线版本。
7. 增加用户身份、会话隔离、持久化快照和回放测试。

## 目录

```text
data/       世界、人物和记忆种子
public/     浏览器叙事控制台
src/        引擎、Agent、护栏、模型客户端、HTTP 服务
 test/      Node 内置测试
```
