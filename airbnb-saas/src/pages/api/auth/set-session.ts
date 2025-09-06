import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const access_token = payload?.access_token as string | undefined;
    const refresh_token = payload?.refresh_token as string | undefined;

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Missing tokens' });
    }

    const supabase = createServerSupabaseClient({ req, res });
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return res.status(400).json({ error: error.message });

    // helper cookie to avoid first-hop race conditions in dev/prod
    res.setHeader('Set-Cookie', [
      `auth-ok=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`,
    ]);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[api/auth/set-session] error:', e?.message || e);
    return res.status(500).json({ error: 'Failed to set session' });
  }
}
