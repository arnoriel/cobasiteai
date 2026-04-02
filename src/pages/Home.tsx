import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Zap, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PromptInput from '../components/PromptInput';
import StreamingOutput from '../components/StreamingOutput';
import CreditsBadge from '../components/CreditsBadge';
import UserMenu from '../components/UserMenu';
import type { Website, GenerationStatus } from '../types';
import { ENV } from '../lib/env';
import { dbStorage } from '../lib/dbStorage';
import { generateWebsite, extractWebsiteName } from '../lib/ai';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [streamedCode, setStreamedCode] = useState('');
  const [currentWebsite, setCurrentWebsite] = useState<Website | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshWebsites = useCallback(async () => {
    if (!user) return;
    const sites = await dbStorage.getAll(user.id);
    setWebsites(sites);
  }, [user]);

  useEffect(() => {
    refreshWebsites();
  }, [refreshWebsites]);

  const handleGenerate = useCallback(async (prompt: string, apiKey: string) => {
    if (!user || !profile) return;

    // Check credits
    if (profile.credits <= 0) {
      setErrorMessage('Credit kamu habis! Tunggu jam 7 pagi untuk reset, atau minta admin untuk isi ulang.');
      setStatus('error');
      return;
    }

    // Deduct 1 credit atomically
    const ok = await dbStorage.useCredit(user.id);
    if (!ok) {
      setErrorMessage('Credit kamu habis! Tunggu jam 7 pagi untuk reset, atau minta admin untuk isi ulang.');
      setStatus('error');
      return;
    }
    await refreshProfile();

    setStatus('thinking');
    setStreamedCode('');
    setCurrentWebsite(null);
    setErrorMessage('');

    const id = dbStorage.generateId();
    const name = extractWebsiteName(prompt);

    const newSite: Website = {
      id,
      name,
      prompt,
      source_code: '',
      created_at: new Date().toISOString(),
    };

    await dbStorage.save(newSite, user.id);
    setActiveId(id);
    setCurrentWebsite(newSite);
    await refreshWebsites();

    let accumulatedCode = '';

    await generateWebsite(apiKey, prompt, {
      onChunk: (chunk) => {
        accumulatedCode += chunk;
        setStreamedCode(accumulatedCode);
        setStatus('streaming');
      },
      onDone: async (fullCode) => {
        await dbStorage.update(id, user.id, { source_code: fullCode });
        const updatedSite = { ...newSite, source_code: fullCode };
        setCurrentWebsite(updatedSite);
        setStreamedCode(fullCode);
        setStatus('done');
        await refreshWebsites();
      },
      onError: (err) => {
        setErrorMessage(err);
        setStatus('error');
        dbStorage.delete(id, user.id);
        refreshWebsites();
      },
    });
  }, [user, profile, refreshWebsites, refreshProfile]);

  const handlePreview = (id: string) => {
    navigate(`/websites/${id}/preview`);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (activeId === id) {
      setActiveId(undefined);
      setStatus('idle');
      setStreamedCode('');
      setCurrentWebsite(null);
    }
    await refreshWebsites();
  };

  const noCredits = (profile?.credits ?? 1) <= 0;

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        websites={websites}
        activeId={activeId}
        onSelect={setActiveId}
        onPreview={handlePreview}
        onDelete={handleDelete}
        onRefresh={refreshWebsites}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-base-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C5CFC, #00E5D4)' }}
            >
              <Globe size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-text-primary leading-none">
                CobasiteAI
              </h1>
              <p className="text-xs text-text-muted mt-0.5">Agentic Website Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Zap size={11} className="text-accent-glow" />
              <span>{ENV.model}</span>
            </div>
            <CreditsBadge />
            <UserMenu />
          </div>
        </header>

        {/* No credit warning banner */}
        {noCredits && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 border-b border-red-500/20">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">
              Credit habis. Credit akan direset ke 3 setiap hari jam 7 pagi.
              {profile?.is_subscribed ? '' : ' Atau minta admin untuk isi ulang.'}
            </p>
          </div>
        )}

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto bg-grid-pattern">
          {status === 'idle' && websites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-xl"
              >
                <div className="relative mx-auto w-24 h-24 mb-8">
                  <div
                    className="absolute inset-0 rounded-full opacity-30 animate-pulse"
                    style={{ background: 'radial-gradient(circle, #7C5CFC 0%, transparent 70%)' }}
                  />
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7C5CFC20, #00E5D420)', border: '1px solid #7C5CFC40' }}
                  >
                    <Sparkles size={36} className="text-accent-glow" />
                  </div>
                </div>

                <h2 className="font-display text-3xl font-bold text-text-primary mb-3">
                  Describe Your{' '}
                  <span className="text-gradient-accent">Dream Website</span>
                </h2>
                <p className="text-text-secondary text-base leading-relaxed mb-8">
                  CobasiteAI adalah agentic website builder yang mengubah deskripsi teks kamu
                  menjadi website full HTML yang siap pakai — lengkap dengan desain, animasi,
                  dan konten yang compelling.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: '🎨', label: 'Custom Design', desc: 'Tema, warna & font sesuai keinginan' },
                    { icon: '⚡', label: 'Instant Preview', desc: 'Preview langsung di browser' },
                    { icon: '☁️', label: 'Cloud Saved', desc: 'Tersimpan di akun kamu' },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="p-3 rounded-xl bg-base-100 border border-surface-border text-left"
                    >
                      <span className="text-xl">{f.icon}</span>
                      <p className="text-xs font-semibold text-text-primary mt-1.5">{f.label}</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
              {websites.length > 0 && status === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {websites.slice(0, 6).map((site, i) => (
                    <motion.div
                      key={site.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group p-4 rounded-xl bg-base-50 border border-surface-border hover:border-accent/40 cursor-pointer transition-all hover:shadow-glow-accent"
                      onClick={() => handlePreview(site.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
                          <Globe size={14} className="text-accent-glow" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-glow transition-colors">
                            {site.name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-snug">
                            {site.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                        <span className="px-1.5 py-0.5 rounded bg-accent-muted text-accent-glow font-mono">
                          {site.source_code.length.toLocaleString()} chars
                        </span>
                        <span>· Click to preview</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {status !== 'idle' && (
                <StreamingOutput
                  status={status}
                  streamedCode={streamedCode}
                  currentWebsite={currentWebsite}
                  onPreview={handlePreview}
                  errorMessage={errorMessage}
                />
              )}
            </div>
          )}
        </main>

        {/* Bottom prompt area */}
        <div className="border-t border-surface-border bg-base-50/80 backdrop-blur px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <PromptInput
              onSubmit={handleGenerate}
              status={status}
              creditsLeft={profile?.credits ?? 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
