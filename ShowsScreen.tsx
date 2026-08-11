import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Show {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  creator: { username: string };
}

export default function ShowsScreen() {
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('shows')
        .select('id, title, description, cover_url, genre, profiles!shows_creator_id_fkey(username)')
        .order('created_at', { ascending: false });
      setShows((data || []).map((s: any) => ({ ...s, creator: s.profiles })));
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4 pb-3">Shows</h1>
      {shows.length === 0 && (
        <p className="text-center text-neutral-500 py-16 text-sm">No shows published yet.</p>
      )}
      <div className="grid grid-cols-2 gap-3 px-3">
        {shows.map((s) => (
          <div key={s.id} className="bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-900">
            <div className="aspect-[2/3] bg-neutral-900">
              {s.cover_url && <img src={s.cover_url} className="w-full h-full object-cover" />}
            </div>
            <div className="p-2">
              <p className="text-sm font-medium line-clamp-1">{s.title}</p>
              <p className="text-xs text-neutral-500">{s.creator.username}</p>
              {s.genre && <p className="text-[10px] text-neutral-600 mt-1">{s.genre}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
