import { deepClone, now } from './utils.js';

export function createInitialState(world) {
  return {
    version: 1,
    turn: 0,
    stage: 0,
    location: '岛田城',
    scene: world.initialScene,
    tension: 0.22,
    completedMilestones: [],
    characters: {
      genji: { emotion: '轻松中带着对束缚的警惕', trust: 0.72, guilt: 0.08, status: 'human', location: '岛田城' },
      hanzo: { emotion: '克制而关切', trust: 0.75, guilt: 0.04, status: 'human', location: '岛田城' }
    },
    history: [],
    interventions: [],
    createdAt: now(),
    updatedAt: now()
  };
}

export function publicState(state, world) {
  return { ...deepClone(state), nextMilestone: world.milestones.find(m => !state.completedMilestones.includes(m.id)) || null };
}
