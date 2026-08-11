import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from './supabaseClient';
import { uploadFile } from './upload';

export default function EditProfileScreen({
  userId,
  initial,
  onBack,
}: {
  userId: string;
  initial: { display_name: string | null; bio: string | null; is_private: boolean };
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState(initial.display_name || '');
  const [bio, setBio] = useState(initial.bio || '');
  const [isPrivate, setIsPrivate] = useState(initial.is_private);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadFile('avatars', avatarFile, 'image', userId);
      }
      await supabase.from('profiles').update({
        display_name: displayName,
        bio,
        is_private: isPrivate,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
      onBack();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-900">
        <button onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="font-medium">Edit Profile</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Profile photo</p>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="text-sm" />
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-1">Display name</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-neutral-900 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-1">Bio</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full bg-neutral-900 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Private account</span>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-white' : 'bg-neutral-800'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-black transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="w-full bg-white text-black rounded-xl py-3 font-medium disabled:opacity-40"
        >
          {busy ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
