import { clamp } from './utils.js';

const ABSTRACT = ['命运','灵魂','救赎','深渊','牢笼','宿命','完整的自我','内心和谐'];
const HANZO_CLICHES = ['荣誉','家族','赎罪'];
const SELF_ANALYSIS = ['我之所以','我的内心','我真正害怕的是','我用','掩饰','本质上','这源于'];

export function assessCharacterVoice(actor, proposal, persona, state) {
  const dialogue = String(proposal.dialogue || '');
  const action = String(proposal.action || '');
  const issues = [];
  let penalty = 0;
  const sentences = dialogue.split(/[。！？!?]/).filter(Boolean);
  const abstractCount = ABSTRACT.filter(x => dialogue.includes(x)).length;
  const selfAnalysisCount = SELF_ANALYSIS.filter(x => dialogue.includes(x)).length;

  if (sentences.length > 4 || dialogue.length > 150) { penalty += .22; issues.push('台词过长，接近作者独白'); }
  if (abstractCount >= 2) { penalty += .25; issues.push('抽象哲理词密度过高'); }
  if (selfAnalysisCount) { penalty += .28; issues.push('角色直接解释潜台词或防御机制'); }

  if (actor === 'genji') {
    if (state.stage === 0 && !/[？?]|别|只是|怎么|哈|算了|兄长/.test(dialogue)) { penalty += .1; issues.push('年轻源氏缺少灵活、试探或玩笑感'); }
    if (state.stage >= 5 && dialogue.includes('过去毫无意义')) { penalty += .4; issues.push('成熟源氏不会否认创伤意义'); }
    if (dialogue.includes('我已彻底放下')) { penalty += .3; issues.push('恢复过程被写成突然痊愈'); }
  }
  if (actor === 'hanzo') {
    const clichéCount = HANZO_CLICHES.filter(x => dialogue.includes(x)).length;
    if (clichéCount >= 2) { penalty += .3; issues.push('半藏被压缩成荣誉/家族/赎罪模板'); }
    if (sentences.length > 2 && state.stage !== 0) { penalty += .12; issues.push('半藏在压力下通常更少说'); }
    if (/请原谅我|我已经释然|我们已经和解/.test(dialogue)) { penalty += .4; issues.push('半藏过早请求宽恕或宣布关系修复'); }
  }

  const preferenceDump = (persona.preferences || []).filter(p => dialogue.includes(p.name)).length;
  if (preferenceDump >= 2) { penalty += .25; issues.push('爱好以百科式清单进入台词'); }
  if (action.includes('解释自己的全部感受')) { penalty += .3; issues.push('动作要求角色完整自我剖析'); }

  return { voiceScore: clamp(1 - penalty), issues, penalty: clamp(penalty) };
}
