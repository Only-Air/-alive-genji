import { EventEmitter } from 'node:events';
import { assessProposal, hardValidate } from './guardrails.js';
import { createInitialState, publicState } from './state.js';
import { clamp, deepClone, id, now } from './utils.js';

export class NarrativeEngine extends EventEmitter {
  constructor({ world, personas, executors, director, reviewThreshold = 0.58 }) {
    super(); Object.assign(this, { world, personas, executors, director, reviewThreshold });
    this.state = createInitialState(world);
  }

  snapshot() { return publicState(this.state, this.world); }
  reset() { this.state = createInitialState(this.world); this.emit('state', this.snapshot()); return this.snapshot(); }

  async turn({ actor, direction = '', proposal: supplied } = {}) {
    if (!this.executors[actor]) throw new Error('actor 必须是 genji 或 hanzo');
    const before = deepClone(this.state);
    const proposal = supplied || await this.executors[actor].propose(this.state, direction);
    const validation = hardValidate(proposal);
    if (validation.length) throw new Error(validation.join('；'));

    const risk = assessProposal({ actor, proposal, state: this.state, world: this.world, persona: this.personas[actor] });
    risk.requiresDirector = risk.risk >= this.reviewThreshold;
    let review = { decision: 'approve', rationale: '低风险动作通过轻量护栏。', revisedProposal: proposal, worldPatch: [], stage: this.state.stage };
    if (risk.requiresDirector) review = await this.director.review({ actor, proposal, risk, state: this.state });
    const accepted = review.decision === 'reject' ? null : (review.revisedProposal || proposal);

    if (accepted) this.apply(actor, accepted);
    this.state.turn += 1;
    this.state.version += 1;
    this.state.updatedAt = now();
    this.state.history.push({ id: id('turn'), at: now(), actor, direction, proposal, accepted, risk, review });
    if (review.intervention) this.state.interventions.push({ at: now(), text: review.intervention });
    this.autoAdvance();

    const result = { before, proposal, risk, review, state: this.snapshot() };
    this.emit('turn', result); this.emit('state', result.state);
    return result;
  }

  apply(actor, proposal) {
    for (const change of proposal.stateChanges || []) this.setSafe(change.path, change.value, actor);
    const other = actor === 'genji' ? 'hanzo' : 'genji';
    this.state.tension = clamp(this.state.tension + (proposal.dialogue.includes('原谅') ? -0.06 : 0.03));
    this.state.characters[actor].trust = clamp(this.state.characters[actor].trust + (proposal.dialogue.includes('兄') || proposal.dialogue.includes('弟') ? 0.015 : 0));
    this.state.characters[other].trust = clamp(this.state.characters[other].trust - (this.state.stage === 2 ? 0.05 : 0));
    this.state.scene = `${this.state.location}：${proposal.action}`;
  }

  setSafe(path, value, actor) {
    const allowed = [`characters.${actor}.emotion`, `characters.${actor}.location`, `characters.${actor}.status`, 'scene', 'location', 'tension'];
    if (!allowed.includes(path)) return;
    const parts = path.split('.'); let target = this.state;
    while (parts.length > 1) target = target[parts.shift()];
    target[parts[0]] = value;
  }

  autoAdvance() {
    if (this.state.turn === 0 || this.state.turn % 2 !== 0 || this.state.stage >= 6) return;
    const milestone = this.world.milestones[this.state.stage];
    if (milestone && !this.state.completedMilestones.includes(milestone.id)) this.state.completedMilestones.push(milestone.id);
    this.state.stage += 1;
    const transitions = [
      ['岛田城', '父亲遇刺的消息传入主殿，家族责任骤然落在兄弟之间。'],
      ['岛田城', '长老施压，兄弟在主殿前的分歧逼近无法回避的决斗。'],
      ['黑守望设施', '源氏从手术后的昏暗中醒来；半藏则留在空荡的岛田城。'],
      ['流浪之路', '岁月分开两条道路：一人成为武器，一人离家赎罪。'],
      ['尼泊尔寺院', '寺院钟声穿过雪山，源氏第一次被要求停止憎恨自己的身体。'],
      ['花村', '多年以后，樱花落在废弃道场，两条道路再次交汇。']
    ];
    const [location, scene] = transitions[this.state.stage - 1] || [this.state.location, this.state.scene];
    this.state.location = location; this.state.scene = scene;
    if (this.state.stage >= 3) this.state.characters.genji.status = 'cyborg';
    if (this.state.stage >= 4) this.state.characters.hanzo.location = '流浪之路';
    if (this.state.stage === 6) { this.state.characters.genji.location = '花村'; this.state.characters.hanzo.location = '花村'; }
    this.state.interventions.push({ at: now(), text: `主持人推进至阶段 ${this.state.stage}：${this.world.milestones[this.state.stage]?.title || '终章'}` });
  }
}
