import crypto from 'node:crypto';

export const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const id = (prefix = 'id') => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
export const now = () => new Date().toISOString();
export const deepClone = value => structuredClone(value);
export const words = text => String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
export const unique = xs => [...new Set(xs)];

export function tokenizeForSimilarity(text) {
  const raw = String(text || '').toLowerCase();
  const latin = raw.match(/[a-z0-9]+/g) || [];
  const han = raw.match(/[\p{Script=Han}]/gu) || [];
  const bigrams = [];
  for (let i = 0; i < han.length - 1; i++) bigrams.push(han[i] + han[i + 1]);
  return unique([...latin, ...han, ...bigrams]);
}

export function similarity(a, b) {
  const A = new Set(tokenizeForSimilarity(a));
  const B = new Set(tokenizeForSimilarity(b));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const x of A) if (B.has(x)) hit++;
  return hit / Math.sqrt(A.size * B.size);
}

export function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error('模型未返回有效 JSON');
}

export function sse(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
