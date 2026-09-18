const scenes = {
  genji: [
    {action:'源氏咬了一口从供桌上顺来的点心，等半藏伸手。',dialogue:'我已经咬过了。你确定还要拿回去？',intent:'用玩笑试探兄长对规矩和自己的容忍',emotion:'顽皮而试探',signals:['bond']},
    {action:'源氏停在主殿门外，没有像长老要求的那样跪下。',dialogue:'你要我留下，可以。但先告诉我——这是你的意思，还是他们的？',intent:'把半藏本人和家主角色区分开',emotion:'悲伤而戒备',signals:['grief']},
    {action:'源氏拔刀挡住去路，却没有先攻。',dialogue:'别再替他们说话。看着我，兄长。',intent:'确认半藏是否仍把自己当弟弟',emotion:'受伤且愤怒',signals:['boundary']},
    {action:'源氏扯下监测线，随后把机械手藏到视线之外。',dialogue:'检查结束了吗？结束了就告诉我下一个目标。',intent:'用任务回避身体与依赖问题',emotion:'敌意和羞耻',signals:['body_rejection']},
    {action:'源氏完成任务后没有庆祝，只把队友递来的游戏币收进口袋。',dialogue:'我没说要去。只是先替你保管。',intent:'让旧日玩心短暂出现，却不承认自己需要连接',emotion:'疏离中出现松动',signals:['identity_drift']},
    {action:'源氏摘下面甲，让别人替他检查无法独自触及的装甲接口。',dialogue:'慢一点。这里还会痛……是的，我知道它是金属。',intent:'练习接受帮助并承认身体感受',emotion:'不自在但信任',signals:['accept_help']},
    {action:'源氏把一枚街机代币弹向半藏，自己先向门外走去。',dialogue:'东京今晚不会消失。来一局吧，兄长。你可以继续皱眉，只要别输。',intent:'邀请半藏进入没有职责目的的共同生活',emotion:'温和、顽皮且坚定',signals:['chosen_family']}
  ],
  hanzo: [
    {action:'半藏摊开手，等源氏交回点心。',dialogue:'拿来。',intent:'维持规矩，也习惯性替弟弟收拾后果',emotion:'无奈但克制',signals:['duty_friction']},
    {action:'半藏把父亲的弓放到身侧，挡住主殿出口。',dialogue:'是我的意思。留下。',intent:'把害怕独自承担说成命令',emotion:'悲痛与恐惧被压成控制',signals:['demand']},
    {action:'半藏拉开弓弦，手指却停了一瞬。',dialogue:'最后一次。放下刀。',intent:'迫使局面恢复控制，同时给自己留下停止的机会',emotion:'极端紧绷',signals:['violent_escalation']},
    {action:'半藏把决斗庭院锁上，回房重新削制一支本已合格的箭。',dialogue:'这支不够直。',intent:'用工艺和苛刻标准压住意义崩塌',emotion:'麻木而羞耻',signals:['hanzo_collapse']},
    {action:'半藏在废弃神社檐下制箭，拒绝村民替他处理伤口。',dialogue:'弦没有断。够用了。',intent:'否认自身需要，把继续受苦当作负责',emotion:'疲惫、自罚',signals:['self_punishment']},
    {action:'半藏收起关于机械忍者的线索，却没有烧掉它。',dialogue:'传闻而已。不要再提。',intent:'压住源氏可能活着所带来的希望与恐惧',emotion:'否认和动摇',signals:['hope_fear']},
    {action:'半藏接住代币，端详片刻，没有把它还回去。',dialogue:'一局。之后巡逻。',intent:'接受普通相处，同时用职责保留体面',emotion:'迟疑但愿意靠近',signals:['accountability']}
  ]
};

export function ruleProposal(actor, state, context='') {
  const item=scenes[actor][Math.min(state.stage,6)];
  return {...item,stateChanges:[{path:`characters.${actor}.emotion`,value:item.emotion}],contextEcho:context.slice(0,60)};
}

export function ruleDirector({proposal,risk,state,actor,world}) {
  const fatal=world.forbiddenAnachronisms.some(x=>`${proposal.action} ${proposal.dialogue}`.includes(x))||risk.reasons.includes('越权修改另一角色状态');
  return {decision:fatal?'reject':risk.voice?.voiceScore<.55?'revise':'approve',rationale:fatal?'违反世界规则或角色自主权。':risk.reasons.join('；')||'动作与当前人物阶段兼容。',revisedProposal:fatal?null:proposal,intervention:risk.voice?.voiceScore<.55?'主持人要求缩短台词并把自我分析改为动作或潜台词。':null,worldPatch:[],stage:state.stage};
}
