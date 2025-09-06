import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Build an absolute URL that includes the query string from the magic link
  const url = new URL(req.url ?? '/', `https://${req.headers.host}`);

  // This sets the auth cookie if the code+verifier are present
  const { error } = await supabase.auth.exchangeCodeForSession(url.toString());
  if (error) {
    console.error('exchangeCodeForSession error:', error);
    return res.status(400).send('Auth error. Please try again.');
  }

  // Optional: honor ?redirect=/somewhere
  const redirect =
    typeof url.searchParams.get('redirect') === 'string' && url.searchParams.get('redirect')
      ? (url.searchParams.get('redirect') as string)
      : '/';
  return res.redirect(302, redirect);
}
