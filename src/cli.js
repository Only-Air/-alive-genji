import { createApp } from './app.js';

const { engine, llm } = createApp();
console.log(`双龙余烬 CLI（${llm.enabled ? 'LLM' : '离线规则'}模式）\n`);
for (let i = 0; i < 6; i++) {
  const actor = i % 2 === 0 ? 'genji' : 'hanzo';
  const result = await engine.turn({ actor });
  const p = result.review.revisedProposal || result.proposal;
  console.log(`[${actor}] ${p.action}\n“${p.dialogue}”\n风险=${result.risk.risk.toFixed(2)} 审核=${result.review.decision}\n`);
}
console.log(JSON.stringify(engine.snapshot(), null, 2));
