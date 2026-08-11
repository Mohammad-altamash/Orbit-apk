import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Repeat2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import CommentsSheet from './CommentsSheet';

export interface FeedPost {
  id: string;
  caption: string | null;
  created_at: string;
  author: { id: string; username: string; avatar_url: string | null };
  media: { media_url: string; media_type: string }[];
  likeCount: number;
  likedByMe: boolean;
}

export default function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  async function toggleLike() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (liked) {
      await supabase.from('likes').delete()
        .match({ user_id: user.id, content_type: 'post', content_id: post.id });
      setLikeCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({
        user_id: user.id, content_type: 'post', content_id: post.id,
      });
      setLikeCount((c) => c + 1);
    }
    setLiked(!liked);
  }

  async function toggleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (saved) {
      await supabase.from('saves').delete()
        .match({ user_id: user.id, content_type: 'post', content_id: post.id });
    } else {
      await supabase.from('saves').insert({
        user_id: user.id, content_type: 'post', content_id: post.id,
      });
    }
    setSaved(!saved);
  }

  async function toggleRepost() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (reposted) {
      await supabase.from('reposts').delete()
        .match({ user_id: user.id, content_type: 'post', content_id: post.id });
    } else {
      await supabase.from('reposts').insert({
        user_id: user.id, content_type: 'post', content_id: post.id,
      });
    }
    setReposted(!reposted);
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ORBIT post', url });
      } catch {
        // user cancelled share sheet, ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 1500);
    }
  }

  return (
    <div className="bg-neutral-950 rounded-2xl overflow-hidden mb-4 border border-neutral-900">
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
          {post.author.avatar_url && (
            <img src={post.author.avatar_url} className="w-full h-full object-cover" />
          )}
        </div>
        <span className="font-medium text-sm">{post.author.username}</span>
      </div>

      {post.media[0] && (
        <div className="w-full aspect-square bg-neutral-900">
          <img src={post.media[0].media_url} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 px-3 py-3 relative">
        <button onClick={toggleLike}>
          <Heart size={24} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'white'} />
        </button>
        <button onClick={() => setShowComments(true)}><MessageCircle size={24} /></button>
        <button onClick={toggleRepost}>
          <Repeat2 size={24} color={reposted ? '#22c55e' : 'white'} />
        </button>
        <button onClick={sharePost}><Share2 size={24} /></button>
        <button onClick={toggleSave} className="ml-auto">
          <Bookmark size={24} fill={saved ? 'white' : 'none'} />
        </button>
        {shareMsg && (
          <span className="absolute right-3 -top-1 text-xs bg-white text-black px-2 py-0.5 rounded-full">
            {shareMsg}
          </span>
        )}
      </div>

      <div className="px-3 pb-3">
        <p className="text-sm font-medium">{likeCount} likes</p>
        {post.caption && (
          <p className="text-sm mt-1">
            <span className="font-medium">{post.author.username}</span> {post.caption}
          </p>
        )}
      </div>

      {showComments && (
        <CommentsSheet contentType="post" contentId={post.id} onClose={() => setShowComments(false)} />
      )}
    </div>
  );
}
