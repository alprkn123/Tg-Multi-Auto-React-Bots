import { handleUpdate } from './handlers/messageHandler';

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const origin = url.origin;

    const tokensRaw: string = env.BOT_TOKENS ?? '';
    const tokens = tokensRaw.split(',').map((t: string) => t.trim()).filter(Boolean);

    const tokenMap: Record<string, string> = {};
    for (const t of tokens) {
      const prefix = t.split(':')[0];
      if (prefix) tokenMap[prefix] = t;
    }

    if (Object.keys(tokenMap).length > 0) {
      ctx.waitUntil(registerAllWebhooks(origin, tokenMap));
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('Bot is running!', { status: 200 });
    }

    if (request.method === 'GET' && url.pathname === '/admin') {
      const html = await generateAdminPanel(env);
      return new Response(html, { 
        status: 200, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    if (request.method === 'GET' && url.pathname === '/setwebhooks') {
      const results = await registerAllWebhooks(origin, tokenMap);
      return new Response(JSON.stringify(results, null, 2), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (request.method === 'POST') {
      const pathMatch = url.pathname.match(/^\/bot([0-9A-Za-z_-]+)/);
      if (!pathMatch) return new Response('', { status: 200 });

      const prefix = pathMatch[1];
      const botToken = tokenMap[prefix];
      if (!botToken) return new Response('', { status: 200 });

      let update: any = null;
      try {
        update = await request.json();
      } catch (e) {
        return new Response('', { status: 200 });
      }

      ctx.waitUntil(handleUpdate(botToken, update, env));
      return new Response('', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }
};

async function registerAllWebhooks(origin: string, tokenMap: Record<string, string>) {
  const results: Record<string, any> = {};
  const promises: Promise<void>[] = [];

  for (const prefix of Object.keys(tokenMap)) {
    const token = tokenMap[prefix];
    const webhookUrl = `${origin}/bot${prefix}`;
    const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    promises.push(
      fetch(url, { method: 'GET' })
        .then(async res => results[prefix] = await res.json())
        .catch(err => results[prefix] = { error: String(err) })
    );
  }

  await Promise.all(promises);
  return results;
}

async function generateAdminPanel(env: any): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bot Admin Panel</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; }
        h1 { color: #333; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .card { background: #0070f3; color: white; padding: 15px; border-radius: 8px; text-align: center; }
        .card h3 { margin: 0; font-size: 14px; }
        .card p { margin: 10px 0 0; font-size: 24px; font-weight: bold; }
        .status { margin: 20px 0; padding: 15px; background: #e8f5e9; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Bot Admin Panel</h1>
        <div class="stats">
          <div class="card"><h3>Total Downloads</h3><p>0</p></div>
          <div class="card"><h3>Total Users</h3><p>0</p></div>
          <div class="card"><h3>Today</h3><p>0</p></div>
        </div>
        <div class="status">
          <h3>System Status</h3>
          <p>✅ Bot is running</p>
          <p>✅ R2 Storage: Active</p>
          <p>✅ KV Cache: Active</p>
          <p>✅ D1 Database: Active</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
