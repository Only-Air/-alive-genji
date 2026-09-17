import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

process.env.LLM_API_KEY = '';

test('离线模式可完成一个有效回合', async () => {
  const { engine } = createApp();
  const result = await engine.turn({ actor: 'genji' });
  assert.equal(result.review.decision, 'approve');
  assert.equal(result.state.turn, 1);
  assert.equal(result.state.history.length, 1);
});

test('时代错置提案会被主持人驳回', async () => {
  const { engine } = createApp();
  const proposal = { action:'源氏打开智能手机直播', dialogue:'欢迎点赞。', intent:'直播', emotion:'兴奋', stateChanges:[] };
  const result = await engine.turn({ actor:'genji', proposal });
  assert.equal(result.review.decision, 'reject');
  assert.ok(result.risk.risk >= .58);
});

test('每两个回合推进一个关键阶段', async () => {
  const { engine } = createApp();
  await engine.turn({ actor:'genji' });
  const result = await engine.turn({ actor:'hanzo' });
  assert.equal(result.state.stage, 1);
  assert.ok(result.state.completedMilestones.includes('childhood'));
});

test('执行者不能修改另一角色状态', async () => {
  const { engine } = createApp();
  const proposal = { action:'源氏平静站立', dialogue:'我只决定自己。', intent:'克制', emotion:'平静', stateChanges:[{path:'characters.hanzo.emotion',value:'狂喜'}] };
  const result = await engine.turn({ actor:'genji', proposal });
  assert.notEqual(result.state.characters.hanzo.emotion, '狂喜');
});
