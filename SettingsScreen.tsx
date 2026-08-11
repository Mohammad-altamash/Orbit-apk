import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { signOut } from './auth';

const sections = [
  'Account', 'Privacy', 'Security', 'Notifications', 'Appearance',
  'Content preferences', 'Blocked users', 'Muted users', 'Close Friends',
  'Language', 'Help', 'About',
];

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [toast, setToast] = useState('');

  function handleTap(section: string) {
    setToast(`${section} — coming soon`);
    setTimeout(() => setToast(''), 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-900">
        <button onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="font-medium">Settings</span>
      </div>

      <div className="divide-y divide-neutral-900">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => handleTap(s)}
            className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-neutral-900"
          >
            <span className="text-sm">{s}</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        ))}
      </div>

      <div className="px-4 py-6 space-y-3">
        <button onClick={() => signOut()} className="w-full bg-neutral-900 rounded-xl py-3 text-sm text-red-400 font-medium">
          Log Out
        </button>
        <button className="w-full bg-neutral-900 rounded-xl py-3 text-sm text-red-500 font-medium">
          Delete Account
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
