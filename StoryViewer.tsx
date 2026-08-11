import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from './supabaseClient';

interface Story {
  id: string;
  media_url: string;
  media_type: string;
  text_content: string | null;
  author_id: string;
}

export default function StoryViewer({
  authorId,
  onClose,
}: {
  authorId: string;
  onClose: () => void;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('stories')
        .select('id, media_url, media_type, text_content, author_id')
        .eq('author_id', authorId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });
      setStories(data || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        for (const s of data) {
          await supabase.from('story_views').upsert(
            { story_id: s.id, viewer_id: user.id },
            { onConflict: 'story_id,viewer_id' }
          );
        }
      }
    }
    load();
  }, [authorId]);

  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setTimeout(() => {
      if (index < stories.length - 1) setIndex(index + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, stories]);

  if (stories.length === 0) return null;
  const current = stories[index];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex gap-1 px-3 pt-3">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-neutral-700 rounded-full overflow-hidden">
            <div className={`h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-full animate-pulse' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 z-10">
        <X size={24} className="text-white" />
      </button>

      <div className="flex-1 flex items-center justify-center">
        {current.media_type === 'image' && (
          <img src={current.media_url} className="max-h-full max-w-full object-contain" />
        )}
        {current.media_type === 'video' && (
          <video src={current.media_url} autoPlay className="max-h-full max-w-full object-contain" />
        )}
        {current.text_content && (
          <p className="absolute text-white text-xl font-medium text-center px-8">{current.text_content}</p>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-4">
        <input
          placeholder="Reply to story..."
          className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white outline-none"
        />
        <button><Send size={20} className="text-white" /></button>
      </div>
    </div>
  );
}
