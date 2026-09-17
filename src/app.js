import { loadConfig } from './config.js';
import { MemoryStore } from './memory.js';
import { OpenAICompatibleClient } from './llm.js';
import { ExecutorAgent, DirectorAgent } from './agents.js';
import { NarrativeEngine } from './engine.js';

export function createApp() {
  const config = loadConfig();
  const memory = new MemoryStore(config.memories);
  const llm = new OpenAICompatibleClient(config.llm);
  const executors = Object.fromEntries(Object.entries(config.personas).map(([id, persona]) => [id, new ExecutorAgent({ id, persona, llm, memory })]));
  const director = new DirectorAgent({ llm, world: config.world });
  const engine = new NarrativeEngine({ world: config.world, personas: config.personas, executors, director, reviewThreshold: config.reviewThreshold });
  return { config, memory, llm, engine };
}
