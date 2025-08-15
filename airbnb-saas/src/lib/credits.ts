import { createSupabaseServerClient } from './supabase-server';

// Deduct 1 credit
export async function consumeCredit(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!profile || profile.credits <= 0) {
    throw new Error('No credits remaining');
  }

  await supabase
    .from('profiles')
    .update({ credits: profile.credits - 1 })
    .eq('id', userId);
}

// Grant credits and optionally change plan
export async function grantCredits(userId: string, amount: number, plan?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  const newCredits = (profile?.credits ?? 0) + amount;

  const update: Record<string, any> = { credits: newCredits };
  if (plan) update.plan_tier = plan;

  await supabase
    .from('profiles')
    .upsert({ id: userId, ...update }, { onConflict: 'id' });
}
