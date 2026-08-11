import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './AuthScreen';
import BottomNav from './BottomNav';
import HomeScreen from './HomeScreen';
import ShortsScreen from './ShortsScreen';
import CreateSheet from './CreateSheet';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import SearchScreen from './SearchScreen';
import NotificationsScreen from './NotificationsScreen';
import LongVideosScreen from './LongVideosScreen';
import ShowsScreen from './ShowsScreen';
import SettingsScreen from './SettingsScreen';
import { Search, Bell } from 'lucide-react';

export type Tab = 'home' | 'shorts' | 'chat' | 'profile';
type Overlay = 'search' | 'notifications' | 'videos' | 'shows' | 'settings' | null;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const [createOpen, setCreateOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-black" />;
  if (!session) return <AuthScreen onAuthSuccess={() => {}} />;

  if (overlay === 'search') return <SearchScreen onBack={() => setOverlay(null)} />;
  if (overlay === 'notifications') return <NotificationsScreen onBack={() => setOverlay(null)} />;
  if (overlay === 'videos') return <LongVideosScreen />;
  if (overlay === 'shows') return <ShowsScreen />;
  if (overlay === 'settings') return <SettingsScreen onBack={() => setOverlay(null)} />;

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {tab === 'home' && (
        <>
          <div className="flex justify-end gap-4 px-4 pt-2">
            <button onClick={() => setOverlay('search')}><Search size={22} /></button>
            <button onClick={() => setOverlay('notifications')}><Bell size={22} /></button>
          </div>
          <HomeScreen />
          <div className="flex gap-3 px-4 py-3">
            <button onClick={() => setOverlay('videos')} className="text-xs bg-neutral-900 rounded-full px-3 py-1.5">Long Videos</button>
            <button onClick={() => setOverlay('shows')} className="text-xs bg-neutral-900 rounded-full px-3 py-1.5">Shows</button>
          </div>
        </>
      )}
      {tab === 'shorts' && <ShortsScreen />}
      {tab === 'chat' && <ChatScreen />}
      {tab === 'profile' && (
        <>
          <div className="flex justify-end px-4 pt-2">
            <button onClick={() => setOverlay('settings')} className="text-sm text-neutral-400">Settings</button>
          </div>
          <ProfileScreen userId={session.user.id} />
        </>
      )}

      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} />}

      <BottomNav active={tab} onChange={setTab} onCreatePress={() => setCreateOpen(true)} />
    </div>
  );
}
