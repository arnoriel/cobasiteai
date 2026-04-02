import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-surface-border hover:border-accent/30 hover:bg-surface-hover transition-all"
      >
        {/* Avatar */}
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? 'User'}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #7C5CFC, #00E5D4)' }}
          >
            {initials}
          </div>
        )}
        <span className="text-xs text-text-secondary font-medium hidden sm:block max-w-[120px] truncate">
          {profile.full_name ?? profile.email}
        </span>
        <ChevronDown size={12} className="text-text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 z-20 rounded-xl bg-base-50 border border-surface-border shadow-card overflow-hidden"
            >
              {/* User info */}
              <div className="px-3 py-3 border-b border-surface-border">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {profile.full_name ?? 'User'}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">{profile.email}</p>
                {profile.is_subscribed && (
                  <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-accent/10 text-teal-accent text-xs font-medium">
                    ✦ Subscribed
                  </span>
                )}
              </div>

              {/* Credits info */}
              <div className="px-3 py-2 border-b border-surface-border">
                <p className="text-xs text-text-muted">
                  Credits: <span className="text-text-primary font-semibold">{profile.credits}</span>
                  {!profile.is_subscribed && (
                    <span className="text-text-muted"> / reset jam 7 pagi</span>
                  )}
                </p>
              </div>

              {/* Sign out */}
              <button
                onClick={() => { signOut(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
