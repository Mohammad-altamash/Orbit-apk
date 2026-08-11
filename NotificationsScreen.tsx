import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, UserPlus, MessageCircle, Star } from 'lucide-react';
import { supabase } from './supabaseClient';

interface Notif {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null };
}

const icons: Record<string, any> = {
  like: Heart, friend_request: UserPlus, friend_accept: UserPlus,
  message: MessageCircle, support: Star,
};

const labels: Record<string, string> = {
  like: 'liked your content',
  comment: 'commented on your post',
  friend_request: 'sent you a friend request',
  friend_accept: 'is now your friend',
  follow: 'started following you',
  support: 'is now supporting you',
  message: 'sent you a message',
};

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('id, type, is_read, created_at, profiles!notifications_actor_id_fkey(username, avatar_url)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifs((data || []).map((n: any) => ({ ...n, actor: n.profiles })));

      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-900">
        <button onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="font-medium">Notifications</span>
      </div>

      {notifs.length === 0 && (
        <p className="text-center text-neutral-500 py-16">No notifications yet.</p>
      )}

      <div className="divide-y divide-neutral-900">
        {notifs.map((n) => {
          const Icon = icons[n.type] || Heart;
          return (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                {n.actor.avatar_url && <img src={n.actor.avatar_url} className="w-full h-full object-cover" />}
              </div>
              <p className="text-sm flex-1">
                <span className="font-medium">{n.actor.username}</span>{' '}
                <span className="text-neutral-400">{labels[n.type] || n.type}</span>
              </p>
              <Icon size={18} className="text-neutral-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
