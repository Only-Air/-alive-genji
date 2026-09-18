import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { assessCharacterVoice } from '../src/styleGuard.js';
process.env.LLM_API_KEY='';

test('离线角色回合包含剧情信号与语言评分',async()=>{const {engine}=createApp();const r=await engine.turn({actor:'genji'});assert.deepEqual(r.proposal.signals,['bond']);assert.ok(r.risk.voice.voiceScore>.8);assert.equal(r.state.turn,1)});

test('必须由双方给出所需信号才推进阶段',async()=>{const {engine}=createApp();await engine.turn({actor:'genji'});assert.equal(engine.state.stage,0);const r=await engine.turn({actor:'hanzo'});assert.equal(r.state.stage,1);assert.ok(r.state.completedMilestones.includes('childhood'))});

test('同一角色重复行动不会按固定回合强推剧情',async()=>{const {engine}=createApp();await engine.turn({actor:'genji'});await engine.turn({actor:'genji'});assert.equal(engine.state.stage,0)});

test('时代错置提案会被驳回',async()=>{const {engine}=createApp();const proposal={action:'源氏打开智能手机直播',dialogue:'欢迎点赞。',intent:'直播',emotion:'兴奋',signals:['bond'],stateChanges:[]};const r=await engine.turn({actor:'genji',proposal});assert.equal(r.review.decision,'reject')});

test('执行者不能修改另一角色状态',async()=>{const {engine}=createApp();const proposal={action:'源氏退后一步',dialogue:'这由你决定。',intent:'保持边界',emotion:'克制',signals:['bond'],stateChanges:[{path:'characters.hanzo.emotion',value:'狂喜'}]};const r=await engine.turn({actor:'genji',proposal});assert.equal(r.review.decision,'reject');assert.notEqual(r.state.characters.hanzo.emotion,'狂喜')});

test('角色语言审核识别模板化半藏独白',()=>{const {config}=createApp();const proposal={action:'半藏解释自己的全部感受',dialogue:'我的内心充满荣誉、家族与赎罪，这源于我真正害怕的是失去。'};const r=assessCharacterVoice('hanzo',proposal,config.personas.hanzo,{stage:4});assert.ok(r.voiceScore<.5);assert.ok(r.issues.length>=3)});

test('角色语言审核允许生活化成熟源氏',()=>{const {config}=createApp();const proposal={action:'源氏把街机代币抛给半藏。',dialogue:'一局。别担心，我会尽量让你。'};const r=assessCharacterVoice('genji',proposal,config.personas.genji,{stage:6});assert.ok(r.voiceScore>.8)});
