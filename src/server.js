import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { ROOT } from './config.js';
import { sse } from './utils.js';

const { config, engine, llm } = createApp();
const clients = new Set();
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const send = (res, code, data) => { res.writeHead(code, { 'content-type':'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', c => { raw += c; if (raw.length > 1e6) reject(new Error('请求体过大')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON 格式错误')); } }); });

engine.on('state', state => { for (const res of clients) sse(res, 'state', state); });
engine.on('turn', result => { for (const res of clients) sse(res, 'turn', result); });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok:true, mode:llm.enabled?'llm':'offline-rule', model:config.llm.model });
    if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, engine.snapshot());
    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, { 'content-type':'text/event-stream', 'cache-control':'no-cache', connection:'keep-alive' });
      clients.add(res); sse(res, 'state', engine.snapshot()); req.on('close', () => clients.delete(res)); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/turn') return send(res, 200, await engine.turn(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/reset') return send(res, 200, engine.reset());
    if (req.method === 'POST' && url.pathname === '/api/auto') {
      const input = await body(req); const count = Math.max(1, Math.min(20, Number(input.count || 2))); const results=[];
      for (let i=0;i<count;i++) results.push(await engine.turn({ actor: (engine.state.turn % 2 === 0 ? 'genji':'hanzo'), direction: input.direction || '' }));
      return send(res, 200, results);
    }
    const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(ROOT, 'public', requested));
    if (!file.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, { error:'未找到' });
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  } catch (error) { send(res, 400, { error:error.message }); }
});

server.listen(config.port, () => console.log(`双龙余烬已启动：http://localhost:${config.port}（${llm.enabled ? 'LLM' : '离线规则'}模式）`));
