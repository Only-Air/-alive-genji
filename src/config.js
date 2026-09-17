import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file), 'utf8'));
}

export function loadConfig() {
  return {
    world: readJson('world.json'),
    personas: readJson('personas.json'),
    memories: readJson('memories.json'),
    port: Number(process.env.PORT || 3000),
    reviewThreshold: Number(process.env.DIRECTOR_REVIEW_THRESHOLD || 0.58),
    llm: {
      baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.LLM_API_KEY || '',
      model: process.env.LLM_MODEL || 'gpt-4.1-mini'
    }
  };
}
