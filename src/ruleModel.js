const replies = {
  genji: [
    ['源氏倚着廊柱，指尖转着一片尚未落地的枫叶。', '兄长，故事里的龙若只听从命运，那还算得上活着吗？'],
    ['源氏收起笑意，目光掠过庭院中熄灭的灯。', '所有人都要我成为岛田家需要的人，可从没有人问我愿意成为什么。'],
    ['源氏握住刀柄，却迟迟没有拔刀。', '若荣誉只剩下服从，它与牢笼有什么分别？'],
    ['金属手指在月光下微微收紧。', '他们救了我的命，也把我变成了我不认识的东西。'],
    ['源氏停在风雪中的石阶前，压低呼吸。', '我曾以为只有斩断过去才能自由，如今我不再确信。'],
    ['源氏合掌静立，让风穿过机械躯体。', '我不是失去血肉的人，也不是只剩钢铁的武器。我仍是我。'],
    ['源氏摘下面甲，直视半藏。', '我来这里不是为了复仇。我来，是要你终于看见我们都还活着。']
  ],
  hanzo: [
    ['半藏端正跪坐，把父亲留下的箭放回箭囊。', '命运不是借口。长子若不承担，家族便无人承担。'],
    ['半藏望向主殿，声音比往日更冷。', '父亲不在了。我们没有继续任性的余地。'],
    ['半藏横身挡住通往主殿的路。', '我不愿与你为敌，但我不能再让你逃避责任。'],
    ['半藏背对空庭，弓弦上的血已干。', '秩序必须延续。至于代价……由我记住。'],
    ['半藏独自走过荒废神社，没有停步。', '赎罪不是求得原谅，而是每日承担自己做过的事。'],
    ['半藏避开寺院钟声，神情阴沉。', '平静属于无罪之人。我没有资格谈论它。'],
    ['半藏拉满弓弦，却无法放箭。', '我为你立过墓，也在每一年告诉自己，那是必要的。原来我只是怯懦。']
  ]
};

export function ruleProposal(actor, state, context = '') {
  const [action, dialogue] = replies[actor][Math.min(state.stage, 6)];
  return {
    action,
    dialogue,
    intent: actor === 'genji' ? '在保留自主性的同时回应兄长' : '用责任感压制自己的脆弱',
    emotion: state.stage >= 5 ? '克制而动摇' : actor === 'genji' ? '警惕' : '压抑',
    stateChanges: [{ path: `characters.${actor}.emotion`, value: state.stage >= 5 ? '克制而动摇' : actor === 'genji' ? '警惕' : '压抑' }],
    contextEcho: context.slice(0, 60)
  };
}

export function ruleDirector({ proposal, risk, state, actor, world }) {
  const text = `${proposal.action} ${proposal.dialogue}`;
  const fatal = world.forbiddenAnachronisms.some(x => text.includes(x)) || text.includes('替你决定');
  return {
    decision: fatal ? 'reject' : risk.risk >= 0.78 ? 'revise' : 'approve',
    rationale: fatal ? '违反世界规则或角色自主性。' : risk.reasons.join('；') || '动作与当前阶段兼容。',
    revisedProposal: fatal ? null : proposal,
    intervention: risk.risk >= 0.78 ? '主持人要求收窄动作影响，只保留当前角色可决定的行为。' : null,
    worldPatch: [],
    stage: state.stage
  };
}
