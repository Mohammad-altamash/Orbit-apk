import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from './supabaseClient';
import { uploadFile } from './upload';

export default function StoryCreator({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'close_friends'>('public');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      let mediaUrl = '';
      let mediaType: 'image' | 'video' | 'text' = 'text';

      if (file) {
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        mediaUrl = await uploadFile('stories', file, mediaType, user.id);
      }

      await supabase.from('stories').insert({
        author_id: user.id,
        media_url: mediaUrl || 'text-only',
        media_type: mediaType,
        text_content: textContent || null,
        visibility,
      });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">New Story</h2>
        <button onClick={onClose}><X size={22} /></button>
      </div>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm text-neutral-300 mb-3"
      />

      <textarea
        placeholder="Add text (optional)..."
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className="w-full bg-neutral-900 rounded-xl px-3 py-2 text-sm outline-none mb-3"
        rows={3}
      />

      <p className="text-xs text-neutral-500 mb-2">Who can see this</p>
      <div className="flex gap-2 mb-4">
        {(['public', 'friends', 'close_friends'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVisibility(v)}
            className={`px-3 py-1.5 rounded-full text-xs ${
              visibility === v ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400'
            }`}
          >
            {v === 'close_friends' ? 'Close Friends' : v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || (!file && !textContent)}
        className="w-full bg-white text-black rounded-xl py-3 font-medium disabled:opacity-40 mt-auto"
      >
        {busy ? 'Posting...' : 'Share to Story'}
      </button>
    </div>
  );
}
