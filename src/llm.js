import { extractJson } from './utils.js';

export class OpenAICompatibleClient {
  constructor({ baseUrl, apiKey, model }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model;
  }

  get enabled() { return Boolean(this.apiKey); }

  async json({ system, user, temperature = 0.7 }) {
    if (!this.enabled) throw new Error('LLM_API_KEY 未配置');
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    });
    if (!response.ok) throw new Error(`LLM 请求失败 ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return extractJson(data.choices?.[0]?.message?.content || '');
  }
}
