
export interface Env {
  // Use any for DB to fix 'Cannot find name D1Database' error in non-Worker environments
  DB: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
      // GET /store-data?domain=site.com
      if (url.pathname === '/store-data' && method === 'GET') {
        const domain = url.searchParams.get('domain');
        if (!domain) return new Response('Missing domain', { status: 400 });

        const coupons = await env.DB.prepare(
          "SELECT * FROM coupons WHERE store = ? AND (upvotes - downvotes) > -5 ORDER BY (upvotes - downvotes) DESC"
        ).bind(domain).all();

        const referral = await env.DB.prepare(
          "SELECT referral_url FROM referrals WHERE store = ?"
        ).bind(domain).first();

        return Response.json({
          coupons: coupons.results,
          referral: referral ? referral.referral_url : null
        }, { headers: corsHeaders });
      }

      // POST /add-coupon
      if (url.pathname === '/add-coupon' && method === 'POST') {
        const { store, code, description } = await request.json() as any;
        const id = crypto.randomUUID();
        
        await env.DB.prepare(
          "INSERT OR IGNORE INTO coupons (id, store, code, description) VALUES (?, ?, ?, ?)"
        ).bind(id, store, code.toUpperCase(), description).run();

        return new Response('OK', { headers: corsHeaders });
      }

      // POST /vote
      if (url.pathname === '/vote' && method === 'POST') {
        const { id, type } = await request.json() as any;
        const column = type === 'up' ? 'upvotes' : 'downvotes';
        
        await env.DB.prepare(
          `UPDATE coupons SET ${column} = ${column} + 1 WHERE id = ?`
        ).bind(id).run();

        return new Response('OK', { headers: corsHeaders });
      }

      // GET /missing-referrals
      if (url.pathname === '/missing-referrals' && method === 'GET') {
        const missing = await env.DB.prepare(`
          SELECT DISTINCT store FROM coupons 
          WHERE store NOT IN (SELECT store FROM referrals)
          LIMIT 20
        `).all();
        
        return Response.json(missing.results, { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404 });
    } catch (e: any) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  }
};
