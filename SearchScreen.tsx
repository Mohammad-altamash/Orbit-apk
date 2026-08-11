import { useState } from 'react';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { supabase } from './supabaseClient';

interface UserResult { id: string; username: string; display_name: string | null; avatar_url: string | null; }
interface PostResult { id: string; caption: string | null; media_url: string | null; }

export default function SearchScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbit_recent_searches') || '[]'); }
    catch { return []; }
  });

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) { setUsers([]); setPosts([]); return; }

    const { data: userData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${q}%`)
      .limit(10);
    setUsers(userData || []);

    // search posts by caption (covers captions and #hashtags typed inside them)
    const { data: postData } = await supabase
      .from('posts')
      .select('id, caption, post_media(media_url)')
      .ilike('caption', `%${q}%`)
      .limit(10);

    setPosts(
      (postData || []).map((p: any) => ({
        id: p.id,
        caption: p.caption,
        media_url: p.post_media?.[0]?.media_url || null,
      }))
    );
  }

  function saveRecent(q: string) {
    if (!q.trim()) return;
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 8);
    setRecent(updated);
    localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} /></button>
        <div className="flex-1 flex items-center gap-2 bg-neutral-900 rounded-full px-3 py-2">
          <SearchIcon size={18} className="text-neutral-500" />
          <input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveRecent(query)}
            placeholder="Search users, posts, hashtags..."
            className="bg-transparent flex-1 outline-none text-sm"
            autoFocus
          />
        </div>
      </div>

      {!query && recent.length > 0 && (
        <div className="px-4">
          <p className="text-xs text-neutral-500 mb-2">Recent</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} onClick={() => runSearch(r)} className="bg-neutral-900 rounded-full px-3 py-1 text-sm text-neutral-300">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && users.length > 0 && (
        <div className="px-4 mt-2">
          <p className="text-xs text-neutral-500 mb-2">People</p>
          <div className="px-0">
            {users.map((u) => (
              <div key={u.id} onClick={() => saveRecent(query)} className="flex items-center gap-3 py-2">
                <div className="w-11 h-11 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                  {u.avatar_url && <img src={u.avatar_url} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.username}</p>
                  {u.display_name && <p className="text-xs text-neutral-500">{u.display_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {query && posts.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-xs text-neutral-500 mb-2">Posts</p>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p) => (
              <div key={p.id} onClick={() => saveRecent(query)} className="aspect-square bg-neutral-900 rounded overflow-hidden">
                {p.media_url && <img src={p.media_url} className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {query && users.length === 0 && posts.length === 0 && (
        <p className="text-center text-neutral-500 text-sm py-8">No results for "{query}"</p>
      )}
    </div>
  );
}
