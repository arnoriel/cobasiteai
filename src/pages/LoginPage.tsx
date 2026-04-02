import { motion } from 'framer-motion';
import { Globe, Sparkles, Zap, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,92,252,0.12) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C5CFC, #00E5D4)' }}
          >
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-text-primary leading-none">
              CobasiteAI
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Agentic Website Builder</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-base-50 border border-surface-border p-8 shadow-card">
          {/* Headline */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div
                className="absolute inset-0 rounded-full opacity-25 animate-pulse"
                style={{ background: 'radial-gradient(circle, #7C5CFC 0%, transparent 70%)' }}
              />
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFC20, #00E5D420)',
                  border: '1px solid #7C5CFC40',
                }}
              >
                <Sparkles size={26} className="text-accent-glow" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
              Selamat Datang
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Sign in dengan Google dan dapatkan{' '}
              <span className="text-accent-glow font-semibold">3 credits gratis</span>{' '}
              setiap hari untuk membuat website impianmu.
            </p>
          </div>

          {/* Free credits info */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { icon: '🎨', label: '3 Credits/Hari', desc: 'Gratis setiap hari' },
              { icon: '⚡', label: 'Instant Build', desc: 'Website siap pakai' },
              { icon: '☁️', label: 'Cloud Saved', desc: 'Tersimpan di cloud' },
            ].map((f) => (
              <div
                key={f.label}
                className="p-3 rounded-xl bg-base-100 border border-surface-border text-center"
              >
                <span className="text-lg">{f.icon}</span>
                <p className="text-xs font-semibold text-text-primary mt-1.5 leading-tight">{f.label}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Google Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-surface-border bg-base-100 hover:bg-surface-hover hover:border-accent/30 transition-all font-semibold text-text-primary text-sm"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path
                d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                fill="#FFC107"
              />
              <path
                d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
              />
              <path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.316 0-9.828-3.337-11.534-8H6.306C9.614 39.558 16.236 44 24 44z"
                fill="#4CAF50"
              />
              <path
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                fill="#1976D2"
              />
            </svg>
            Lanjutkan dengan Google
          </motion.button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 mt-5 p-3 rounded-lg bg-base-100 border border-surface-border">
            <Lock size={12} className="text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              Data kamu aman. Kami hanya menyimpan email dan website yang kamu buat. Tidak ada data yang dijual ke pihak ketiga.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-text-muted">
          <Zap size={10} className="text-accent-glow" />
          <span>Powered by OpenRouter AI</span>
        </div>
      </motion.div>
    </div>
  );
}
