import { clamp, similarity } from './utils.js';
import { assessCharacterVoice } from './styleGuard.js';

const MAJOR = ['杀死','死亡','自杀','摧毁','爆炸','离开家族','改造','赛博格','穿越','传送','永远告别'];
const FORCE = ['你必须替','替你决定','你其实想','控制对方','让半藏说','让源氏说'];

export function assessProposal({ actor, proposal, state, world, persona }) {
  const text = `${proposal.action || ''} ${proposal.dialogue || ''} ${proposal.intent || ''}`;
  const reasons = [];
  let risk = 0.06;
  for (const item of world.forbiddenAnachronisms) if (text.includes(item)) { risk += .65; reasons.push(`时代错置：${item}`); }
  if (MAJOR.some(x => text.includes(x))) { risk += .27; reasons.push('涉及重大、不可逆状态变化'); }
  if (FORCE.some(x => text.includes(x))) { risk += .38; reasons.push('疑似替另一角色决定行动或内心'); }
  if ((proposal.stateChanges || []).some(c => c.path?.startsWith(`characters.${actor === 'genji' ? 'hanzo' : 'genji'}`))) { risk += .5; reasons.push('越权修改另一角色状态'); }
  if ((proposal.stateChanges || []).length > 2) { risk += .15; reasons.push('单回合状态修改过多'); }
  for (const avoid of persona.stable.speech.avoid) if (similarity(text, avoid) > .42) { risk += .12; reasons.push(`触及语言禁区：${avoid}`); }
  if (state.turn > 2 && proposal.dialogue === state.history.at(-2)?.proposal?.dialogue) { risk += .25; reasons.push('疑似循环对话'); }
  const voice = assessCharacterVoice(actor, proposal, persona, state);
  if (voice.penalty) { risk += voice.penalty * .65; reasons.push(...voice.issues); }
  return { risk: clamp(risk), reasons: [...new Set(reasons)], voice, requiresDirector: risk >= .58 || voice.voiceScore < .68 };
}

export function hardValidate(proposal) {
  const errors=[];
  if (!proposal || typeof proposal !== 'object') errors.push('提案必须为对象');
  if (!String(proposal?.action || '').trim()) errors.push('action 不能为空');
  if (!String(proposal?.dialogue || '').trim()) errors.push('dialogue 不能为空');
  if (!Array.isArray(proposal?.stateChanges)) errors.push('stateChanges 必须为数组');
  if (!Array.isArray(proposal?.signals)) errors.push('signals 必须为数组');
  return errors;
}
