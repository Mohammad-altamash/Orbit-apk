import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { signOut } from './auth';
import EditProfileScreen from './EditProfileScreen';

interface ProfileData {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
}

export default function ProfileScreen({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [supporterCount, setSupporterCount] = useState(0);
  const [supportingCount, setSupportingCount] = useState(0);
  const [editing, setEditing] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, bio, avatar_url, is_private')
      .eq('id', userId)
      .single();
    setProfile(data);

    const { count: fCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    setFriendCount(fCount || 0);

    const { count: spCount } = await supabase
      .from('supports')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);
    setSupporterCount(spCount || 0);

    const { count: sgCount } = await supabase
      .from('supports')
      .select('*', { count: 'exact', head: true })
      .eq('supporter_id', userId);
    setSupportingCount(sgCount || 0);
  }

  useEffect(() => {
    load();
  }, [userId]);

  if (editing && profile) {
    return (
      <EditProfileScreen
        userId={userId}
        initial={{ display_name: profile.display_name, bio: profile.bio, is_private: profile.is_private }}
        onBack={() => {
          setEditing(false);
          load();
        }}
      />
    );
  }

  if (!profile) return <div className="p-4 text-neutral-500">Loading profile...</div>;

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
          {profile.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 flex justify-around text-center">
          <div>
            <p className="font-semibold">{friendCount}</p>
            <p className="text-xs text-neutral-500">Friends</p>
          </div>
          <div>
            <p className="font-semibold">{supporterCount}</p>
            <p className="text-xs text-neutral-500">Supporters</p>
          </div>
          <div>
            <p className="font-semibold">{supportingCount}</p>
            <p className="text-xs text-neutral-500">Supporting</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="font-medium">{profile.display_name || profile.username}</p>
        <p className="text-sm text-neutral-500">@{profile.username}</p>
        {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 bg-neutral-900 rounded-xl py-2 text-sm font-medium"
        >
          Edit Profile
        </button>
        <button onClick={() => signOut()} className="flex-1 bg-neutral-900 rounded-xl py-2 text-sm font-medium text-red-400">
          Log Out
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-6"></div>
    </div>
  );
}
