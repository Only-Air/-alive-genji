import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const child = spawn(process.execPath, ['src/server.js'], { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: '3217', LLM_API_KEY: '' } });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('服务启动超时')), 5000);
  child.stdout.on('data', chunk => { if (String(chunk).includes('3217')) { clearTimeout(timer); resolve(); } });
  child.on('exit', code => reject(new Error(`服务提前退出 ${code}`)));
});
try {
  const health = await fetch('http://localhost:3217/api/health').then(r => r.json());
  assert.equal(health.ok, true);
  const result = await fetch('http://localhost:3217/api/turn', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({actor:'genji'}) }).then(r => r.json());
  assert.equal(result.state.turn, 1);
  const html = await fetch('http://localhost:3217/').then(r => r.text());
  assert.match(html, /双龙余烬/);
  console.log('HTTP smoke test passed');
} finally {
  child.kill('SIGTERM');
}
