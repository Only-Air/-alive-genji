import { EventEmitter } from 'node:events';
import { assessProposal, hardValidate } from './guardrails.js';
import { createInitialState, publicState } from './state.js';
import { clamp, deepClone, id, now } from './utils.js';

const transitions=[
  ['岛田城','父亲遇刺后，长老要求半藏接掌家族，也要求源氏服从。'],
  ['岛田城','私人需要与家族命令混在一起，兄弟冲突逼近不可逆边界。'],
  ['黑守望设施','源氏在改造设施醒来；半藏留在岛田城，无法再相信自己遵循的一切。'],
  ['流浪之路','岛田犯罪帝国瓦解后，一人失去复仇目标，一人以流浪和危险维持自罚。'],
  ['尼泊尔寺院','源氏开始学习接受帮助；关于机械忍者的传闻也传到半藏耳中。'],
  ['东京','兄弟已经重新选择彼此，如今必须学习如何共同生活并保护故乡。']
];

export class NarrativeEngine extends EventEmitter {
  constructor({world,personas,executors,director,reviewThreshold=.58}) { super();Object.assign(this,{world,personas,executors,director,reviewThreshold});this.state=createInitialState(world);this.state.stageSignals={}; }
  snapshot(){return publicState(this.state,this.world)}
  reset(){this.state=createInitialState(this.world);this.state.stageSignals={};this.emit('state',this.snapshot());return this.snapshot()}

  async turn({actor,direction='',proposal:supplied}={}) {
    if(!this.executors[actor]) throw new Error('actor 必须是 genji 或 hanzo');
    const before=deepClone(this.state);
    const proposal=supplied||await this.executors[actor].propose(this.state,direction);
    const validation=hardValidate(proposal);if(validation.length)throw new Error(validation.join('；'));
    const risk=assessProposal({actor,proposal,state:this.state,world:this.world,persona:this.personas[actor]});
    risk.requiresDirector=risk.risk>=this.reviewThreshold||risk.requiresDirector;
    let review={decision:'approve',rationale:'低风险且角色语言通过轻量审核。',revisedProposal:proposal,worldPatch:[],stage:this.state.stage};
    if(risk.requiresDirector)review=await this.director.review({actor,proposal,risk,state:this.state});
    const accepted=review.decision==='reject'?null:(review.revisedProposal||proposal);
    if(accepted){this.apply(actor,accepted);this.recordSignals(actor,accepted.signals||[])}
    this.state.turn++;this.state.version++;this.state.updatedAt=now();
    this.state.history.push({id:id('turn'),at:now(),actor,direction,proposal,accepted,risk,review});
    if(review.intervention)this.state.interventions.push({at:now(),text:review.intervention});
    this.evaluateMilestone();
    const result={before,proposal,risk,review,state:this.snapshot()};this.emit('turn',result);this.emit('state',result.state);return result;
  }

  apply(actor,proposal){
    for(const change of proposal.stateChanges||[])this.setSafe(change.path,change.value,actor);
    const other=actor==='genji'?'hanzo':'genji';
    this.state.tension=clamp(this.state.tension+(this.state.stage===2?.09:.02));
    this.state.characters[actor].trust=clamp(this.state.characters[actor].trust+(/兄长|弟弟|兄弟/.test(proposal.dialogue)?.01:0));
    if(this.state.stage===2)this.state.characters[other].trust=clamp(this.state.characters[other].trust-.04);
    this.state.scene=`${this.state.location}：${proposal.action}`;
  }
  setSafe(path,value,actor){const allowed=[`characters.${actor}.emotion`,`characters.${actor}.location`,`characters.${actor}.status`,'scene','tension'];if(!allowed.includes(path))return;const parts=path.split('.');let target=this.state;while(parts.length>1)target=target[parts.shift()];target[parts[0]]=value}
  recordSignals(actor,signals){const key=String(this.state.stage);this.state.stageSignals[key]??={genji:[],hanzo:[]};this.state.stageSignals[key][actor].push(...signals.filter(Boolean))}
  evaluateMilestone(){
    const milestone=this.world.milestones[this.state.stage];if(!milestone||this.state.completedMilestones.includes(milestone.id))return;
    const bucket=this.state.stageSignals[String(this.state.stage)]||{genji:[],hanzo:[]};
    const all=new Set([...bucket.genji,...bucket.hanzo]);
    const stageTurns=this.state.history.filter(h=>h.before?.stage===this.state.stage).length||[...bucket.genji,...bucket.hanzo].length;
    const hasActors=bucket.genji.length>0&&bucket.hanzo.length>0;
    const ready=milestone.requiredSignals.every(s=>all.has(s))&&hasActors&&stageTurns>=milestone.minTurns;
    if(!ready)return;
    this.state.completedMilestones.push(milestone.id);
    if(this.state.stage>=6){this.state.interventions.push({at:now(),text:'最终节点条件满足：兄弟已选择共同承担未来，但关系修复仍保持开放。'});return;}
    this.state.stage++;
    const [location,scene]=transitions[this.state.stage-1];this.state.location=location;this.state.scene=scene;
    if(this.state.stage>=3)this.state.characters.genji.status='cyborg';
    if(this.state.stage>=4)this.state.characters.hanzo.status='exile';
    if(this.state.stage===6){this.state.characters.genji.location='东京';this.state.characters.hanzo.location='东京'}
    this.state.interventions.push({at:now(),text:`条件满足，主持人推进至阶段 ${this.state.stage}：${this.world.milestones[this.state.stage].title}`});
  }
}
