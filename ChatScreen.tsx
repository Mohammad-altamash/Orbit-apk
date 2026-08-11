import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ChatThreadScreen from './ChatThreadScreen';

interface Conversation {
  id: string;
  otherUsername: string;
  otherAvatar: string | null;
  lastMessage: string | null;
}

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) { setLoading(false); return; }

      const convIds = memberships.map((m) => m.conversation_id);

      const { data: otherMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id, profiles!inner(username, avatar_url)')
        .in('conversation_id', convIds)
        .neq('user_id', user.id);

      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const list: Conversation[] = (otherMembers || []).map((m: any) => ({
        id: m.conversation_id,
        otherUsername: m.profiles.username,
        otherAvatar: m.profiles.avatar_url,
        lastMessage: lastMessages?.find((msg) => msg.conversation_id === m.conversation_id)?.body || null,
      }));

      setConversations(list);
      setLoading(false);
    }
    load();
  }, []);

  if (activeConv) {
    return <ChatThreadScreen conversationId={activeConv} onBack={() => setActiveConv(null)} />;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4 pb-3">Chat</h1>

      {loading && <p className="px-4 text-neutral-500 text-sm">Loading...</p>}

      {!loading && conversations.length === 0 && (
        <div className="text-center py-20 text-neutral-500">
          <p>No conversations yet.</p>
          <p className="text-sm mt-1">Message a friend to get started.</p>
        </div>
      )}

      <div className="px-2">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveConv(c.id)}
            className="flex items-center gap-3 px-2 py-3 hover:bg-neutral-900 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
              {c.otherAvatar && <img src={c.otherAvatar} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{c.otherUsername}</p>
              <p className="text-xs text-neutral-500 truncate">{c.lastMessage || 'No messages yet'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
