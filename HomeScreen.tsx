import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import StoriesBar from './StoriesBar';
import PostCard, { FeedPost } from './PostCard';

type FeedTab = 'forYou' | 'following' | 'friends' | 'nearby' | 'trending';

export default function HomeScreen() {
  const [tab, setTab] = useState<FeedTab>('forYou');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [tab]);

  async function loadFeed() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, caption, created_at,
        profiles!posts_author_id_fkey(id, username, avatar_url),
        post_media(media_url, media_type)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) { setLoading(false); return; }

    const postIds = data.map((p: any) => p.id);
    const { data: likesData } = await supabase
      .from('likes')
      .select('content_id, user_id')
      .eq('content_type', 'post')
      .in('content_id', postIds.length ? postIds : ['00000000-0000-0000-0000-000000000000']);

    const mapped: FeedPost[] = data.map((p: any) => {
      const likesForPost = (likesData || []).filter((l) => l.content_id === p.id);
      return {
        id: p.id,
        caption: p.caption,
        created_at: p.created_at,
        author: p.profiles,
        media: p.post_media,
        likeCount: likesForPost.length,
        likedByMe: !!likesForPost.find((l) => l.user_id === user?.id),
      };
    });

    setPosts(mapped);
    setLoading(false);
  }

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'forYou', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'friends', label: 'Friends' },
    { key: 'nearby', label: 'Nearby' },
    { key: 'trending', label: 'Trending' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <img src="/logo.png" alt="ORBIT" width="26" height="26" className="rounded-md" />
        <h1 className="text-xl font-semibold tracking-wide">ORBIT</h1>
      </div>

      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar border-b border-neutral-900 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm whitespace-nowrap pb-1 ${
              tab === t.key ? 'text-white border-b-2 border-white font-medium' : 'text-neutral-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <StoriesBar />

      <div className="px-3 pt-2">
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="w-full aspect-square bg-neutral-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            <p>No posts yet.</p>
            <p className="text-sm mt-1">Be the first to post something.</p>
          </div>
        )}

        {!loading && posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}
