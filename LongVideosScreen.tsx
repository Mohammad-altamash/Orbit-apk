import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import CommentsSheet from './CommentsSheet';

type VTab = 'suggested' | 'trending' | 'following' | 'nearby' | 'my';

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  video_url: string;
  author: { id: string; username: string; avatar_url: string | null };
}

export default function LongVideosScreen() {
  const [tab, setTab] = useState<VTab>('suggested');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const [myId, setMyId] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || ''));
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, duration_seconds, video_url, profiles!videos_author_id_fkey(id, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30);
      setVideos((data || []).map((v: any) => ({ ...v, author: v.profiles })));
    }
    load();
  }, [tab]);

  async function openVideo(v: VideoItem) {
    setPlaying(v);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'video')
      .eq('content_id', v.id);
    setLikeCount(count || 0);

    const { data: myLike } = await supabase
      .from('likes')
      .select('id')
      .match({ user_id: user.id, content_type: 'video', content_id: v.id })
      .maybeSingle();
    setLiked(!!myLike);

    const { data: mySave } = await supabase
      .from('saves')
      .select('id')
      .match({ user_id: user.id, content_type: 'video', content_id: v.id })
      .maybeSingle();
    setSaved(!!mySave);

    if (v.author.id !== user.id) {
      const { data: mySupport } = await supabase
        .from('supports')
        .select('id')
        .match({ supporter_id: user.id, creator_id: v.author.id })
        .maybeSingle();
      setSupporting(!!mySupport);
    }
  }

  async function toggleLike() {
    if (!playing || !myId) return;
    if (liked) {
      await supabase.from('likes').delete().match({ user_id: myId, content_type: 'video', content_id: playing.id });
      setLikeCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ user_id: myId, content_type: 'video', content_id: playing.id });
      setLikeCount((c) => c + 1);
    }
    setLiked(!liked);
  }

  async function toggleSave() {
    if (!playing || !myId) return;
    if (saved) {
      await supabase.from('saves').delete().match({ user_id: myId, content_type: 'video', content_id: playing.id });
    } else {
      await supabase.from('saves').insert({ user_id: myId, content_type: 'video', content_id: playing.id });
    }
    setSaved(!saved);
  }

  async function toggleSupport() {
    if (!playing || !myId) return;
    if (supporting) {
      await supabase.from('supports').delete().match({ supporter_id: myId, creator_id: playing.author.id });
    } else {
      await supabase.from('supports').insert({ supporter_id: myId, creator_id: playing.author.id });
    }
    setSupporting(!supporting);
  }

  async function shareVideo() {
    if (!playing) return;
    const url = `${window.location.origin}/video/${playing.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: playing.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 1500);
    }
  }

  if (playing) {
    const isOwnVideo = playing.author.id === myId;
    return (
      <div className="bg-black min-h-screen">
        <video src={playing.video_url} controls autoPlay className="w-full aspect-video" />
        <div className="px-4 py-3">
          <h2 className="font-medium">{playing.title}</h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-neutral-500">{playing.author.username}</p>
            {!isOwnVideo && (
              <button
                onClick={toggleSupport}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  supporting ? 'bg-neutral-800 text-white' : 'bg-white text-black'
                }`}
              >
                {supporting ? 'Supporting' : 'Support'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-5 mt-4 relative">
            <button onClick={toggleLike} className="flex items-center gap-1.5">
              <Heart size={22} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'white'} />
              <span className="text-sm text-neutral-400">{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(true)}><MessageCircle size={22} /></button>
            <button onClick={shareVideo}><Share2 size={22} /></button>
            <button onClick={toggleSave} className="ml-auto">
              <Bookmark size={22} fill={saved ? 'white' : 'none'} />
            </button>
            {shareMsg && (
              <span className="absolute right-0 -top-6 text-xs bg-white text-black px-2 py-0.5 rounded-full">
                {shareMsg}
              </span>
            )}
          </div>

          <button onClick={() => setPlaying(null)} className="mt-5 text-sm text-neutral-400">← Back to videos</button>
        </div>

        {showComments && (
          <CommentsSheet contentType="video" contentId={playing.id} onClose={() => setShowComments(false)} />
        )}
      </div>
    );
  }

  const tabs: { key: VTab; label: string }[] = [
    { key: 'suggested', label: 'Suggested' },
    { key: 'trending', label: 'Trending' },
    { key: 'following', label: 'Following' },
    { key: 'nearby', label: 'Nearby' },
    { key: 'my', label: 'My' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4 pb-2">Videos</h1>
      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar border-b border-neutral-900 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm whitespace-nowrap pb-1 ${tab === t.key ? 'text-white border-b-2 border-white font-medium' : 'text-neutral-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-3 pt-3 space-y-4">
        {videos.length === 0 && <p className="text-center text-neutral-500 py-16 text-sm">No videos yet.</p>}
        {videos.map((v) => (
          <div key={v.id} onClick={() => openVideo(v)} className="flex gap-3">
            <div className="w-32 aspect-video bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 relative">
              {v.thumbnail_url && <img src={v.thumbnail_url} className="w-full h-full object-cover" />}
              <span className="absolute bottom-1 right-1 bg-black/70 text-[10px] px-1 rounded">
                {Math.floor(v.duration_seconds)}s
              </span>
            </div>
            <div>
              <p className="text-sm font-medium line-clamp-2">{v.title}</p>
              <p className="text-xs text-neutral-500 mt-1">{v.author.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
