import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { supabase } from './supabaseClient';
import CommentsSheet from './CommentsSheet';

interface Short {
  id: string;
  video_url: string;
  caption: string | null;
  author: { id: string; username: string; avatar_url: string | null };
}

export default function ShortsScreen() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [myId, setMyId] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || ''));

    async function load() {
      const { data } = await supabase
        .from('shorts')
        .select('id, video_url, caption, profiles!shorts_author_id_fkey(id, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!data) return;
      const list = data.map((s: any) => ({ ...s, author: s.profiles }));
      setShorts(list);

      const ids = list.map((s) => s.id);
      if (ids.length === 0) return;

      const { data: likes } = await supabase
        .from('likes')
        .select('content_id, user_id')
        .eq('content_type', 'short')
        .in('content_id', ids);

      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      const { data: { user } } = await supabase.auth.getUser();
      (likes || []).forEach((l) => {
        counts[l.content_id] = (counts[l.content_id] || 0) + 1;
        if (user && l.user_id === user.id) mine.add(l.content_id);
      });
      setLikeCounts(counts);
      setLikedIds(mine);

      if (user) {
        const { data: saves } = await supabase
          .from('saves')
          .select('content_id')
          .eq('content_type', 'short')
          .eq('user_id', user.id)
          .in('content_id', ids);
        setSavedIds(new Set((saves || []).map((s) => s.content_id)));
      }
    }
    load();
  }, []);

  async function toggleLike(id: string) {
    if (!myId) return;
    const isLiked = likedIds.has(id);
    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: myId, content_type: 'short', content_id: id });
      setLikeCounts((c) => ({ ...c, [id]: (c[id] || 1) - 1 }));
      setLikedIds((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await supabase.from('likes').insert({ user_id: myId, content_type: 'short', content_id: id });
      setLikeCounts((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      setLikedIds((s) => new Set(s).add(id));
    }
  }

  async function toggleSave(id: string) {
    if (!myId) return;
    const isSaved = savedIds.has(id);
    if (isSaved) {
      await supabase.from('saves').delete().match({ user_id: myId, content_type: 'short', content_id: id });
      setSavedIds((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await supabase.from('saves').insert({ user_id: myId, content_type: 'short', content_id: id });
      setSavedIds((s) => new Set(s).add(id));
    }
  }

  async function share(id: string) {
    const url = `${window.location.origin}/short/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ORBIT short', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg(id);
      setTimeout(() => setShareMsg(null), 1500);
    }
  }

  if (shorts.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-neutral-500">
        No shorts yet. Tap + to upload one.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {shorts.map((s) => (
        <div key={s.id} className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
          <video src={s.video_url} className="h-full w-full object-cover" autoPlay loop muted playsInline />

          <div className="absolute bottom-24 left-4 right-16 text-white">
            <p className="font-medium">@{s.author.username}</p>
            {s.caption && <p className="text-sm mt-1">{s.caption}</p>}
          </div>

          <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-white">
            <button onClick={() => toggleLike(s.id)} className="flex flex-col items-center gap-1">
              <Heart size={28} fill={likedIds.has(s.id) ? '#ef4444' : 'none'} color={likedIds.has(s.id) ? '#ef4444' : 'white'} />
              <span className="text-xs">{likeCounts[s.id] || 0}</span>
            </button>
            <button onClick={() => setShowComments(s.id)} className="flex flex-col items-center">
              <MessageCircle size={28} />
            </button>
            <button onClick={() => toggleSave(s.id)} className="flex flex-col items-center">
              <Bookmark size={28} fill={savedIds.has(s.id) ? 'white' : 'none'} />
            </button>
            <button onClick={() => share(s.id)} className="flex flex-col items-center">
              <Share2 size={28} />
            </button>
          </div>

          {shareMsg === s.id && (
            <span className="absolute bottom-52 right-3 text-xs bg-white text-black px-2 py-0.5 rounded-full">
              Link copied!
            </span>
          )}

          {showComments === s.id && (
            <CommentsSheet contentType="short" contentId={s.id} onClose={() => setShowComments(null)} />
          )}
        </div>
      ))}
    </div>
  );
}
