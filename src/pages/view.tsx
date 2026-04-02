import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  ArrowLeft,
  Pencil,
  AlertTriangle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Link,
  Check,
} from 'lucide-react';
import { dbStorage } from '../lib/dbStorage'; // ✅ FIX: was `storage` (localStorage)
import { useAuth } from '../contexts/AuthContext';
import type { Website } from '../types';

export default function ViewPage() {
  const { id, page_name } = useParams<{ id: string; page_name: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ FIX: butuh userId untuk dbStorage.getById
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [website, setWebsite] = useState<Website | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // ✅ FIX: ganti storage.getById (sync localStorage) → dbStorage.getById (async Supabase)
  useEffect(() => {
    if (!id || !user) return;

    dbStorage.getById(id, user.id).then((site) => {
      if (!site) {
        setNotFound(true);
        return;
      }
      if (!site.page_name) {
        setNotFound(true);
        return;
      }
      setWebsite(site);
    }).catch(() => {
      setNotFound(true);
    });
  }, [id, user]);

  // Write HTML into iframe once we have the website
  useEffect(() => {
    if (!website?.source_code || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(website.source_code);
      doc.close();
    }
  }, [website]);

  const handleIframeLoad = () => setIsLoading(false);

  const goToPreview = () => navigate(`/websites/${id}/preview`);

  const getShareableUrl = () => {
    if (!website?.page_name) return null;
    return `${window.location.origin}/page/${website.page_name}`;
  };

  const openStandalone = () => {
    if (!website?.source_code || !website.page_name) return;

    const shareableUrl = getShareableUrl();

    const injectScript = shareableUrl
      ? `<script>\ntry {\n  window.history.replaceState(null, '', ${JSON.stringify(shareableUrl)});\n} catch(e) {}\n</script>`
      : '';

    let html = website.source_code;
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${injectScript}`);
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', `<HEAD>${injectScript}`);
    } else {
      html = injectScript + html;
    }

    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const copyShareableLink = async () => {
    const url = getShareableUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Not Found ──────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-muted mb-6 max-w-sm text-sm">
          The page{' '}
          <code className="text-accent-glow font-mono">
            /websites/{id}/{page_name}
          </code>{' '}
          doesn't exist or hasn't been deployed yet.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
        >
          <ArrowLeft size={14} />
          Back to CobasiteAI
        </button>
      </div>
    );
  }

  // ── Loading state (waiting for Supabase fetch) ──────────────
  if (!website && !notFound) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">Loading page…</p>
        </div>
      </div>
    );
  }

  if (!website) return null;

  // ── Main view ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Floating top banner */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-50 flex items-center gap-3 px-4 py-2.5 bg-base-50/95 backdrop-blur border-b border-surface-border flex-shrink-0"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
          >

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-6 h-6 rounded-lg bg-accent-muted flex items-center justify-center">
                <Globe size={11} className="text-accent-glow" />
              </div>
              <span className="text-xs font-semibold text-accent-glow hidden sm:block">
                CobasiteAI
              </span>
            </div>

            <div className="w-px h-4 bg-surface-border flex-shrink-0" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-base-100 border border-surface-border flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-text-primary truncate max-w-[140px] sm:max-w-xs">
                {website.page_name}
              </span>
            </div>

            <p className="flex-1 text-xs text-text-muted truncate hidden md:block">
              {website.name}
            </p>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={copyShareableLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary text-xs transition-colors border border-surface-border"
                title={`Copy link: ${getShareableUrl() ?? ''}`}
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-green-400" />
                    <span className="hidden sm:inline text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Link size={11} />
                    <span className="hidden sm:inline">Copy link</span>
                  </>
                )}
              </button>

              <button
                onClick={openStandalone}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary text-xs transition-colors border border-surface-border"
                title="Open standalone"
              >
                <ExternalLink size={11} />
                <span className="hidden sm:inline">Open</span>
              </button>
              <button
                onClick={goToPreview}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
                title="Edit in preview"
              >
                <Pencil size={11} />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                onClick={() => setBannerVisible(false)}
                className="p-1.5 rounded-lg hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors"
                title="Hide banner"
              >
                <ChevronUp size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show banner button when hidden */}
      <AnimatePresence>
        {!bannerVisible && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setBannerVisible(true)}
            className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white transition-all shadow-lg"
            style={{ background: 'rgba(124,92,252,0.85)', backdropFilter: 'blur(8px)' }}
          >
            <Globe size={10} />
            CobasiteAI
            <ChevronDown size={10} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Iframe: full page render */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-xs text-zinc-400">Loading page…</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 block"
          title={website.name}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}