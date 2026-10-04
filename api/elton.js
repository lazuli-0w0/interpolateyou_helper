const crypto = require('node:crypto');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const reply = (status, value) => res.status(status).json(value);
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return reply(405, { code: 'method' }); }
  const url = process.env.ELTON_GATEWAY_URL, secret = process.env.ELTON_GATEWAY_KEY;
  if (!url || !secret) return reply(503, { code: 'unavailable', available: false });
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    const allowed = new Set(['https://interpolateyou-helper.vercel.app', 'https://interpolateyou.com', 'https://www.interpolateyou.com', process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]);
    if (!allowed.has(origin)) return reply(403, { code: 'origin' });
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { code: 'invalid' });
    const input = req.body;
    if (!input || Object.keys(input).some(k => k !== 'messages') || !Array.isArray(input.messages) || !input.messages.length || input.messages.length > 10) return reply(400, { code: 'invalid' });
    let length = 0;
    for (let i = 0; i < input.messages.length; i++) {
      const m = input.messages[i];
      if (!m || Object.keys(m).some(k => !['role', 'content'].includes(k)) || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 1500 || (i && m.role === input.messages[i - 1].role)) return reply(400, { code: 'invalid' });
      length += m.content.length;
    }
    if (length > 5000 || input.messages.at(-1).role !== 'user') return reply(400, { code: 'invalid' });
  }
  try {
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
    const response = await fetch(`${url.replace(/\/$/, '')}/${req.method === 'GET' ? 'health' : 'chat'}`, {
      method: req.method,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'X-Elton-Visitor': crypto.createHmac('sha256', secret).update(ip).digest('hex') },
      ...(req.method === 'POST' ? { body: JSON.stringify({ messages: req.body.messages }) } : {}), signal: AbortSignal.timeout(req.method === 'GET' ? 8000 : 105000)
    });
    const data = await response.json();
    if (!response.ok) return reply(response.status === 429 ? 429 : 503, { code: data.code === 'busy' || data.code === 'rate_limit' ? data.code : 'unavailable' });
    if (req.method === 'GET') return reply(200, { available: data.available === true });
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('empty');
    return reply(200, { reply: data.reply, model: data.model, checkpoint: data.checkpoint });
  } catch { return reply(503, { code: 'unavailable', available: false }); }
};
