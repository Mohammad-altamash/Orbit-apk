import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from './supabaseClient';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author: { username: string; avatar_url: string | null };
}

export default function CommentsSheet({
  contentType,
  contentId,
  onClose,
}: {
  contentType: 'post' | 'short' | 'video';
  contentId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || ''));
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, profiles!comments_author_id_fkey(username, avatar_url)')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });
    setComments((data || []).map((c: any) => ({ ...c, author: c.profiles })));
  }

  async function submit() {
    if (!input.trim() || !myId) return;
    const body = input;
    setInput('');
    await supabase.from('comments').insert({
      author_id: myId, content_type: contentType, content_id: contentId, body,
    });
    load();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="bg-neutral-950 w-full rounded-t-3xl h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-900">
          <span className="font-medium">Comments</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-center text-neutral-500 text-sm py-8">No comments yet. Be the first.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                {c.author.avatar_url && <img src={c.author.avatar_url} className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium">{c.author.username}</span>{' '}
                  <span className="text-neutral-300">{c.body}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-neutral-900">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Add a comment..."
            className="flex-1 bg-neutral-900 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button onClick={submit} className="bg-white rounded-full p-2">
            <Send size={16} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
