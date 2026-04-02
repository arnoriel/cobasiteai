import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CreditsBadge() {
  const { profile } = useAuth();

  if (!profile) return null;

  const credits = profile.credits;
  const isLow = credits <= 1;
  const isEmpty = credits === 0;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
        isEmpty
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : isLow
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-accent-muted border-accent/30 text-accent-glow'
      }`}
    >
      <Zap size={10} className={isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-accent-glow'} />
      <span>
        {credits} credit{credits !== 1 ? 's' : ''}
      </span>
      {profile.is_subscribed && (
        <span className="ml-0.5 text-teal-accent">✦</span>
      )}
    </div>
  );
}
