import { ruleProposal, ruleDirector } from './ruleModel.js';

export class ExecutorAgent {
  constructor({id,persona,llm,memory}) { Object.assign(this,{id,persona,llm,memory}); }
  async propose(state,userDirection='') {
    const stage=this.persona.stages[state.stage];
    const memories=this.memory.retrieve(this.id,state.stage,`${state.scene} ${userDirection}`,5);
    if(!this.llm.enabled) return ruleProposal(this.id,state,userDirection);
    const system=`你是${this.persona.displayName}执行者。只决定自己的言语与动作。不要把内部心理说明原样说出口。\n稳定人格=${JSON.stringify(this.persona.stable)}\n当前阶段=${JSON.stringify(stage)}\n关系=${JSON.stringify(this.persona.relationships)}\n可自然使用的日常偏好=${JSON.stringify(this.persona.preferences)}\n要求：台词自然短小；爱好只能由情境自然触发；与其他角色必须有独立意志。只返回JSON：{action,dialogue,intent,emotion,signals:[],stateChanges:[{path,value}]}`;
    return this.llm.json({system,user:JSON.stringify({scene:state.scene,stage:state.stage,recentHistory:state.history.slice(-4),retrievedMemories:memories,userDirection}),temperature:.78});
  }
}

export class DirectorAgent {
  constructor({llm,world,personas}) { Object.assign(this,{llm,world,personas}); }
  async review(input) {
    if(!this.llm.enabled) return ruleDirector({...input,world:this.world});
    const system=`你是叙事主持人，不替角色写完整人生。审核：世界事实、角色自主权、当前阶段、潜台词、生活化细节和语言辨识度。源氏不能退化成持续说禅理的苦行者；半藏不能退化成反复说荣誉/家族/赎罪的模板武士。若修订，保留意图但把心理分析改成动作和短台词。只返回JSON：{decision:"approve|revise|reject",rationale,revisedProposal,intervention,worldPatch:[],stage}`;
    return this.llm.json({system,user:JSON.stringify({...input,rules:this.world.rules,persona:this.personas[input.actor],milestone:this.world.milestones[input.state.stage]}),temperature:.12});
  }
}
