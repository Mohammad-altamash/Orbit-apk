import { supabase } from './supabaseClient';

export async function reportContent(
  targetType: 'post' | 'short' | 'video' | 'comment' | 'user' | 'story',
  targetId: string,
  reason: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id, target_type: targetType, target_id: targetId, reason,
  });
  if (error) throw error;
}
