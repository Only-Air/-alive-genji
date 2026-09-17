import { clamp, similarity } from './utils.js';

const MAJOR = ['杀死', '死亡', '自杀', '摧毁', '爆炸', '离开家族', '改造', '赛博格', '穿越', '传送', '永远告别'];
const FORCE = ['你必须', '替你决定', '你其实想', '控制对方', '让半藏说', '让源氏说'];

export function assessProposal({ actor, proposal, state, world, persona }) {
  const text = `${proposal.action || ''} ${proposal.dialogue || ''} ${proposal.intent || ''}`;
  const reasons = [];
  let risk = 0.08;

  for (const item of world.forbiddenAnachronisms) {
    if (text.includes(item)) { risk += 0.62; reasons.push(`时代错置：${item}`); }
  }
  if (MAJOR.some(x => text.includes(x))) { risk += 0.28; reasons.push('涉及重大、不可逆状态变化'); }
  if (FORCE.some(x => text.includes(x))) { risk += 0.35; reasons.push('疑似替另一角色决定行动或内心'); }
  if ((proposal.stateChanges || []).length > 2) { risk += 0.16; reasons.push('单回合状态修改过多'); }
  if (persona.taboos.some(x => similarity(text, x) > 0.38)) { risk += 0.35; reasons.push('可能偏离角色禁忌'); }
  if (state.turn > 2 && text === state.history.at(-2)?.proposal?.dialogue) { risk += 0.25; reasons.push('疑似循环对话'); }

  return { risk: clamp(risk), reasons, requiresDirector: risk >= 0.58 };
}

export function hardValidate(proposal) {
  const errors = [];
  if (!proposal || typeof proposal !== 'object') errors.push('提案必须为对象');
  if (!String(proposal?.action || '').trim()) errors.push('action 不能为空');
  if (!String(proposal?.dialogue || '').trim()) errors.push('dialogue 不能为空');
  if (!Array.isArray(proposal?.stateChanges)) errors.push('stateChanges 必须为数组');
  return errors;
}
