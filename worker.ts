export interface Env {
  DB: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

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

      // POST /vote (MIT UNVOTE LOGIK)
      if (url.pathname === '/vote' && method === 'POST') {
        const { id, type } = await request.json() as any;
        
        let query = "";
        if (type === 'up') query = "UPDATE coupons SET upvotes = upvotes + 1 WHERE id = ?";
        if (type === 'down') query = "UPDATE coupons SET downvotes = downvotes + 1 WHERE id = ?";
        if (type === 'remove_up') query = "UPDATE coupons SET upvotes = MAX(0, upvotes - 1) WHERE id = ?";
        if (type === 'remove_down') query = "UPDATE coupons SET downvotes = MAX(0, downvotes - 1) WHERE id = ?";
        
        if (query === "") return new Response('Invalid vote type', { status: 400 });

        await env.DB.prepare(query).bind(id).run();
        return new Response('OK', { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404 });
    } catch (e: any) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  }
};