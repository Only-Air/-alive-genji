import { ruleProposal, ruleDirector } from './ruleModel.js';

export class ExecutorAgent {
  constructor({ id, persona, llm, memory }) { Object.assign(this, { id, persona, llm, memory }); }

  async propose(state, userDirection = '') {
    const memories = this.memory.retrieve(this.id, state.stage, `${state.scene} ${userDirection}`);
    if (!this.llm.enabled) return ruleProposal(this.id, state, userDirection);
    const system = `你是${this.persona.displayName}的执行者智能体。只能决定自己的言语与动作。人格：${this.persona.voice}。当前弧线：${this.persona.arcByStage[state.stage]}。禁忌：${this.persona.taboos.join('；')}。必须只返回 JSON：{action,dialogue,intent,emotion,stateChanges:[{path,value}]}`;
    const user = JSON.stringify({ scene: state.scene, location: state.location, stage: state.stage, recentHistory: state.history.slice(-4), memories, userDirection });
    return this.llm.json({ system, user, temperature: 0.85 });
  }
}

export class DirectorAgent {
  constructor({ llm, world }) { Object.assign(this, { llm, world }); }

  async review(input) {
    if (!this.llm.enabled) return ruleDirector({ ...input, world: this.world });
    const system = `你是叙事主持人。审核动作是否符合时间线、角色自主性、世界规则与当前阶段。只能返回 JSON：{decision:"approve|revise|reject",rationale,revisedProposal,intervention,worldPatch:[],stage}`;
    return this.llm.json({ system, user: JSON.stringify({ ...input, rules: this.world.rules, milestones: this.world.milestones }), temperature: 0.15 });
  }
}
