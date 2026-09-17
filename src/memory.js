import { similarity } from './utils.js';

export class MemoryStore {
  constructor(seed = []) { this.items = [...seed]; }

  retrieve(actor, stage, query, limit = 4) {
    return this.items
      .filter(m => m.actors.includes(actor) && m.stages.includes(stage))
      .map(m => ({ ...m, score: similarity(query, m.text) + (m.stages.includes(stage) ? 0.25 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  add(memory) { this.items.push(memory); }
}
