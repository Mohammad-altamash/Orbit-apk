import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import StoryViewer from './StoryViewer';

interface StoryGroup {
  author_id: string;
  username: string;
  avatar_url: string | null;
}

export default function StoriesBar() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('stories')
        .select('author_id, profiles!inner(id, username, avatar_url)')
        .gt('expires_at', new Date().toISOString());

      if (!data) return;
      const seen = new Set<string>();
      const unique: StoryGroup[] = [];
      for (const row of data as any[]) {
        if (!seen.has(row.author_id)) {
          seen.add(row.author_id);
          unique.push({
            author_id: row.author_id,
            username: row.profiles.username,
            avatar_url: row.profiles.avatar_url,
          });
        }
      }
      setGroups(unique);
    }
    load();
  }, []);

  return (
    <div className="flex gap-4 px-3 py-3 overflow-x-auto no-scrollbar">
      {groups.map((g) => (
        <div
          onClick={() => setViewing(g.author_id)}
          key={g.author_id}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-orange-400 to-pink-500">
            <div className="w-full h-full rounded-full bg-black p-[2px]">
              <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden">
                {g.avatar_url && <img src={g.avatar_url} className="w-full h-full object-cover" />}
              </div>
            </div>
          </div>
          <span className="text-xs text-neutral-300 truncate w-16 text-center">{g.username}</span>
        </div>
      ))}
      {groups.length === 0 && (
        <p className="text-xs text-neutral-500 py-4">No active stories yet</p>
      )}
      {viewing && <StoryViewer authorId={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
