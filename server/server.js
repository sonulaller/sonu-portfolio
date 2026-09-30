import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function send(res, status, payload) {
  res.writeHead(status, {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1000000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase environment variables are not configured');
  }
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `Supabase request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  try {
    if (req.method === 'GET' && path === '/api/health') {
      return send(res, 200, {
        ok: true,
        service: 'sonu-portfolio-api',
        databaseConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY)
      });
    }

    if (req.method === 'GET' && path === '/api/projects') {
      const data = await supabaseRequest('projects?select=*&order=created_at.desc');
      return send(res, 200, data || []);
    }

    if (req.method === 'GET' && path === '/api/blogs') {
      const data = await supabaseRequest('blogs?select=*&order=created_at.desc');
      return send(res, 200, data || []);
    }

    if (req.method === 'POST' && path === '/api/contact') {
      const body = await readJson(req);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!name || !email || !message) {
        return send(res, 400, { ok: false, error: 'name, email and message are required' });
      }
      if (!isValidEmail(email)) {
        return send(res, 400, { ok: false, error: 'Please provide a valid email address' });
      }
      await supabaseRequest('messages', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ name, email, message })
      });
      return send(res, 201, { ok: true });
    }

    return send(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    const status = /not configured|Supabase request failed/.test(error.message) ? 503 : 500;
    return send(res, status, { ok: false, error: error.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`sonu-portfolio-api listening on port ${PORT}`);
});
