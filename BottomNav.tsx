import { Home, Clapperboard, Plus, MessageCircle, User } from 'lucide-react';
import type { Tab } from './App';

export default function BottomNav({
  active,
  onChange,
  onCreatePress,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onCreatePress: () => void;
}) {
  const items: { key: Tab; icon: any }[] = [
    { key: 'home', icon: Home },
    { key: 'shorts', icon: Clapperboard },
  ];
  const itemsRight: { key: Tab; icon: any }[] = [
    { key: 'chat', icon: MessageCircle },
    { key: 'profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-neutral-800 flex items-center justify-around py-2 px-4 z-50">
      {items.map(({ key, icon: Icon }) => (
        <button key={key} onClick={() => onChange(key)} className="p-2">
          <Icon size={26} strokeWidth={active === key ? 2.5 : 1.8} className={active === key ? 'text-white' : 'text-neutral-500'} />
        </button>
      ))}

      <button onClick={onCreatePress} className="bg-white rounded-2xl p-3 -mt-4 shadow-lg">
        <Plus size={24} strokeWidth={2.5} className="text-black" />
      </button>

      {itemsRight.map(({ key, icon: Icon }) => (
        <button key={key} onClick={() => onChange(key)} className="p-2">
          <Icon size={26} strokeWidth={active === key ? 2.5 : 1.8} className={active === key ? 'text-white' : 'text-neutral-500'} />
        </button>
      ))}
    </nav>
  );
}
