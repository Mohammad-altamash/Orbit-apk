import { useState } from 'react';
import { X, Image, Video, Clapperboard, CircleDashed, Radio } from 'lucide-react';
import { supabase } from './supabaseClient';
import { uploadFile, getVideoDuration } from './upload';
import StoryCreator from './StoryCreator';

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'menu' | 'post' | 'short' | 'video' | 'story'>('menu');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submitPost() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const url = await uploadFile('posts', file, 'image', user.id);
      const { data: post, error: postErr } = await supabase
        .from('posts').insert({ author_id: user.id, caption }).select().single();
      if (postErr) throw postErr;

      await supabase.from('post_media').insert({
        post_id: post.id, media_url: url, media_type: 'image', position: 0,
      });

      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitShort() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const duration = await getVideoDuration(file);
      if (duration > 15) throw new Error('Shorts must be 15 seconds or under.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const url = await uploadFile('videos', file, 'video', user.id);
      await supabase.from('shorts').insert({
        author_id: user.id, video_url: url, caption, duration_seconds: duration,
      });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitVideo() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const duration = await getVideoDuration(file);
      if (duration > 300) throw new Error('Videos must be 5 minutes or under.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const url = await uploadFile('videos', file, 'video', user.id);
      await supabase.from('videos').insert({
        author_id: user.id, video_url: url, title: caption || 'Untitled', duration_seconds: duration,
      });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'story') {
    return <StoryCreator onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="bg-neutral-950 w-full rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">
            {mode === 'menu' ? 'Create' : mode === 'post' ? 'New Post' : mode === 'short' ? 'New Short' : 'Upload Video'}
          </h2>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        {mode === 'menu' && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('post')} className="bg-neutral-900 rounded-2xl p-5 flex flex-col items-center gap-2">
              <Image size={26} /> <span className="text-sm">Photo Post</span>
            </button>
            <button onClick={() => setMode('short')} className="bg-neutral-900 rounded-2xl p-5 flex flex-col items-center gap-2">
              <Clapperboard size={26} /> <span className="text-sm">Create Short</span>
              <span className="text-[10px] text-neutral-500">Max 15s</span>
            </button>
            <button onClick={() => setMode('video')} className="bg-neutral-900 rounded-2xl p-5 flex flex-col items-center gap-2">
              <Video size={26} /> <span className="text-sm">Upload Video</span>
              <span className="text-[10px] text-neutral-500">Max 5 min</span>
            </button>
            <button onClick={() => setMode('story')} className="bg-neutral-900 rounded-2xl p-5 flex flex-col items-center gap-2">
              <CircleDashed size={26} /> <span className="text-sm">Create Story</span>
              <span className="text-[10px] text-neutral-500">Expires in 24h</span>
            </button>
            <button disabled className="col-span-2 bg-neutral-900/50 rounded-2xl p-5 flex flex-col items-center gap-2 opacity-40">
              <Radio size={26} /> <span className="text-sm">Live (Coming Soon)</span>
            </button>
          </div>
        )}

        {(mode === 'post' || mode === 'short' || mode === 'video') && (
          <div className="space-y-3">
            <input
              type="file"
              accept={mode === 'post' ? 'image/*' : 'video/*'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-neutral-300"
            />
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-neutral-900 rounded-xl px-3 py-2 text-sm outline-none"
              rows={3}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              disabled={!file || busy}
              onClick={mode === 'post' ? submitPost : mode === 'short' ? submitShort : submitVideo}
              className="w-full bg-white text-black rounded-xl py-3 font-medium disabled:opacity-40"
            >
              {busy ? 'Uploading...' : 'Post'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
