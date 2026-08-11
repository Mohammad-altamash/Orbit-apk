import { supabase } from './supabaseClient';

export async function sendFriendRequest(receiverId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase.from('friend_requests').insert({
    sender_id: user.id, receiver_id: receiverId,
  });
  if (error) throw error;
}

export async function acceptFriendRequest(requestId: string) {
  const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
  if (error) throw error;
}

export async function declineFriendRequest(requestId: string) {
  const { error } = await supabase.from('friend_requests')
    .update({ status: 'declined' }).eq('id', requestId);
  if (error) throw error;
}

export async function getPendingRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('friend_requests')
    .select('id, sender_id, profiles!friend_requests_sender_id_fkey(username, avatar_url)')
    .eq('receiver_id', user.id)
    .eq('status', 'pending');
  return data || [];
}

export async function startConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data: myConvs } = await supabase
    .from('conversation_members').select('conversation_id').eq('user_id', user.id);
  const { data: theirConvs } = await supabase
    .from('conversation_members').select('conversation_id').eq('user_id', otherUserId);

  const myIds = new Set((myConvs || []).map((c) => c.conversation_id));
  const shared = (theirConvs || []).find((c) => myIds.has(c.conversation_id));
  if (shared) return shared.conversation_id;

  const { data: conv, error } = await supabase
    .from('conversations').insert({ is_group: false }).select().single();
  if (error) throw error;

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return conv.id;
}
