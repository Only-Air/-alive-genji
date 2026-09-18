# 双龙余烬 v2：角色扎根型 Node.js 多智能体叙事系统

这是一个主持人—执行者叙事系统。v2 已推倒早期“自由源氏 / 荣誉半藏”的扁平模型，改为依据现行官方英雄资料、故事线索和游戏互动语音构建的多层角色模型。

> 非商业同人技术演示。角色与世界观权利归各自权利人所有。项目把官方明确事实、基于多条表现的归纳和原创情境分开处理，不声称生成内容属于官方剧情。

## 运行

要求 Node.js 20+，无第三方 npm 依赖。

```bash
npm test
npm start
```

打开 `http://localhost:3000`。不配置密钥时使用可测试的离线角色模型；配置 OpenAI-compatible API 后使用 LLM。

```bash
export LLM_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY=你的密钥
export LLM_MODEL=gpt-4.1-mini
npm start
```

## v2 的核心变化

### 1. 四层人物模型

`data/personas.json` 不再只有几个价值观标签，而是包含：

- **稳定人格**：需要、优点、缺点、防御机制、语言节奏；
- **阶段人格**：同一角色在年轻、决裂、创伤、重建和归家阶段的差异；
- **关系模型**：对兄弟、雾子、禅雅塔、父亲等不同对象的专属关系逻辑；
- **爱好与日常**：只允许通过合适情境自然触发。

源氏模型纳入了街机与游戏、竞争心、三角龙、恐龙鸡块、备餐、装甲维护、接受帮助，以及“逃避责任→主动承担”的成长轴。

半藏模型纳入了诗和俳句、亲手制箭、木雕、花语、锦鲤、清酒、安静环境、未来养狗、被压制的游戏好奇，以及艺术型完美主义和羞耻结构。

### 2. 潜台词与防御机制

模型明确区分：

- 角色内部真正需要什么；
- 角色会用什么防御方式隐藏需要；
- 角色最终会说出口什么。

例如半藏内心可能是“不想再被弟弟留下”，实际台词更可能是“留下”，而不会准确解释自己的依恋创伤。

### 3. 角色声线护栏

`src/styleGuard.js` 检测：

- 作者式长篇独白；
- 抽象哲理词密度；
- 直接解释潜台词；
- “荣誉/家族/赎罪”模板半藏；
- 失去玩心、持续讲禅理的源氏；
- 过早请求宽恕或宣布痊愈；
- 百科式罗列爱好。

每次提案都会产生 `voiceScore`。低分动作会唤醒主持人修订。

### 4. 条件式剧情推进

v1 的“每两回合自动推进”已经移除。每个阶段都有：

- 所需叙事信号；
- 最低互动数；
- 双方均参与的要求。

例如童年阶段必须同时出现 `bond` 与 `duty_friction`，且源氏、半藏都实际行动，才能进入父亲去世阶段。单个角色重复行动不会推动时间线。

### 5. 主持人权限收窄

主持人负责：

- 客观世界事实；
- 角色自主权；
- 重大状态结算；
- 时间线边界；
- 声线和阶段一致性；
- 条件满足后的场景迁移。

主持人不负责替角色规定每回合必须领悟什么，也不会把所有交流修成文学独白。

## 项目结构

```text
data/
  personas.json       四层角色模型
  memories.json       带来源和标签的长期记忆种子
  world.json          世界规则、节点和条件信号
public/                浏览器控制台
src/
  agents.js            执行者和主持人
  engine.js            唯一世界状态写入者
  guardrails.js        世界规则、越权与风险审核
  styleGuard.js        角色语言和潜台词审核
  ruleModel.js         无 API Key 时的角色化离线模型
  memory.js            轻量语义检索
  llm.js               OpenAI-compatible 客户端
  server.js            REST + SSE 服务
test/                  引擎、声线和 HTTP 测试
```

## API

- `GET /api/health`
- `GET /api/state`
- `GET /api/events`
- `POST /api/turn`
- `POST /api/auto`
- `POST /api/reset`

```bash
curl -X POST http://localhost:3000/api/turn \
  -H 'content-type: application/json' \
  -d '{"actor":"genji","direction":"用生活化情境表现兄弟关系，不要讨论宏大命运"}'
```

## 资料依据与证据边界

主要事实依据：

- 源氏官方英雄页：https://overwatch.blizzard.com/en-us/heroes/genji/
- 半藏官方英雄页：https://overwatch.blizzard.com/en-us/heroes/hanzo/
- 官方动画《Dragons》：https://www.youtube.com/watch?v=oJ09xdxzIJQ
- 游戏内互动语音整理：
  - https://overwatch.fandom.com/wiki/Genji/Quotes
  - https://overwatch.fandom.com/wiki/Hanzo/Quotes

互动语音页面为社区整理，但语料来自游戏内实际对白。关键世界观事实优先以官方英雄页与官方故事为准。人物模型中的心理机制属于基于多条官方表现的建模归纳，不应被描述为官方直接声明。

## 测试覆盖

- 条件信号推进，而非固定回合推进；
- 双方参与要求；
- 时代错置驳回；
- 禁止修改另一角色；
- 模板化半藏独白检测；
- 生活化成熟源氏台词放行；
- HTTP 服务与网页访问。
