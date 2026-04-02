import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Code2,
  AlertTriangle,
  Copy,
  Check,
  Wand2,
  Rocket,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Link2,
  Save,
  Pencil,
  Eye,
  Terminal,
  Zap,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import type { Website } from '../types';
import { dbStorage } from '../lib/dbStorage';
import { useAuth } from '../contexts/AuthContext';
import { surgicalEditWebsite } from '../lib/ai';
import type { EditPatch } from '../lib/ai';
import { ENV } from '../lib/env';

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type CodePanelTab = 'view' | 'edit';

const viewportSizes: Record<ViewportMode, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '390px', label: 'Mobile' },
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function countDiffLines(before: string, after: string): { added: number; removed: number } {
  const bLines = new Set(before.split('\n'));
  const aLines = new Set(after.split('\n'));
  let added = 0, removed = 0;
  aLines.forEach((l) => { if (!bLines.has(l)) added++; });
  bLines.forEach((l) => { if (!aLines.has(l)) removed++; });
  return { added, removed };
}

interface PatchEntry {
  description: string;
  success: boolean;
  status: 'done' | 'failed';
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Auth ────────────────────────────────────────────────────
  const { user } = useAuth();

  const [website, setWebsite] = useState<Website | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allWebsites, setAllWebsites] = useState<Website[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // ── Code panel tabs (View / Edit) ──────────────────────────
  const [codePanelTab, setCodePanelTab] = useState<CodePanelTab>('view');
  const [manualEditValue, setManualEditValue] = useState('');
  const [manualSaved, setManualSaved] = useState(false);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Ask-for-Edit state ─────────────────────────────────────
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Surgical-edit streaming state
  const [streamingRaw, setStreamingRaw] = useState('');
  const [patches, setPatches] = useState<PatchEntry[]>([]);
  const [diffStats, setDiffStats] = useState<{ added: number; removed: number } | null>(null);
  const streamingEndRef = useRef<HTMLDivElement>(null);
  const prevSourceRef = useRef<string>('');

  // ── Save & Deploy state ────────────────────────────────────
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!id) { setNotFound(true); return; }

    const load = async () => {
      const [site, all] = await Promise.all([
        dbStorage.getById(id, user.id),
        dbStorage.getAll(user.id),
      ]);
      setAllWebsites(all);
      if (!site) { setNotFound(true); return; }
      setWebsite(site);
      if (site.page_name) {
        setPageName(site.page_name);
        setPageSlug(toSlug(site.page_name));
      }
    };
    load();
  }, [id, user]);

  // Auto-scroll streaming panel
  useEffect(() => {
    streamingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamingRaw, patches]);

  // ── iframe helpers ─────────────────────────────────────────
  const iframeWrittenRef = useRef(false);

  const writeIframe = useCallback((code: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      iframeWrittenRef.current = true;
      doc.open();
      doc.write(code);
      doc.close();
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (website?.source_code) writeIframe(website.source_code);
  }, [website?.source_code, writeIframe]);

  const handleIframeLoad = () => {
    if (iframeWrittenRef.current) setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (website?.source_code) writeIframe(website.source_code);
    }, 40);
  };

  const openInNewTab = () => {
    if (!website?.source_code) return;
    const blob = new Blob([website.source_code], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const downloadHTML = () => {
    if (!website?.source_code) return;
    const blob = new Blob([website.source_code], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${website.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
  };

  const copyCode = async () => {
    if (!website?.source_code) return;
    await navigator.clipboard.writeText(website.source_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchWebsite = (switchId: string) => {
    navigate(`/websites/${switchId}/preview`);
    setShowSwitcher(false);
  };

  // ── Manual Code Editor ─────────────────────────────────────
  const openManualEditor = () => {
    if (!website) return;
    setManualEditValue(website.source_code);
    setCodePanelTab('edit');
    setShowCode(true);
    setManualSaved(false);
    setTimeout(() => codeTextareaRef.current?.focus(), 100);
  };

  const handleManualSave = () => {
    if (!website || !manualEditValue.trim() || !user) return;
    dbStorage.update(website.id, user.id, { source_code: manualEditValue });
    const updated = { ...website, source_code: manualEditValue };
    setWebsite(updated);
    writeIframe(manualEditValue);
    setManualSaved(true);
    setTimeout(() => {
      setManualSaved(false);
      setCodePanelTab('view');
    }, 1500);
  };

  const handleManualDiscard = () => {
    setCodePanelTab('view');
    setManualEditValue('');
    setManualSaved(false);
  };

  // ── Ask for Edit (Surgical) ────────────────────────────────
  const handleEditOpen = () => {
    setShowEditPanel((p) => !p);
    setEditError('');
    setEditSuccess(false);
    setTimeout(() => editTextareaRef.current?.focus(), 150);
  };

  const handleEditSubmit = async () => {
    if (!editPrompt.trim() || !website || isEditing || !user) return;

    setIsEditing(true);
    setEditError('');
    setEditSuccess(false);
    setStreamingRaw('');
    setPatches([]);
    setDiffStats(null);
    setShowCode(true);
    setCodePanelTab('view');
    prevSourceRef.current = website.source_code;

    const apiKey = localStorage.getItem('cobasiteai_api_key') ?? undefined;

    await surgicalEditWebsite(
      ENV.apiKey ?? apiKey,
      website.source_code,
      editPrompt,
      {
        onPatch: (patch: EditPatch, updatedCode: string, success: boolean) => {
          setPatches((prev) => [
            ...prev,
            { description: patch.description, success, status: success ? 'done' : 'failed' },
          ]);
          if (success) {
            writeIframe(updatedCode);
          }
        },
        onChunk: (raw: string) => {
          setStreamingRaw((prev) => prev + raw);
        },
        onDone: (finalCode: string, patchCount: number) => {
          const updated: Website = { ...website, source_code: finalCode };
          dbStorage.update(website.id, user.id, { source_code: finalCode });
          setWebsite(updated);
          writeIframe(finalCode);

          const stats = countDiffLines(prevSourceRef.current, finalCode);
          setDiffStats(stats);

          setIsEditing(false);
          setEditSuccess(true);
          setEditPrompt('');

          if (patchCount > 0) {
            console.log(`✓ ${patchCount} surgical patches applied`);
          }

          setTimeout(() => {
            setEditSuccess(false);
            setShowEditPanel(false);
            setPatches([]);
            setStreamingRaw('');
            setDiffStats(null);
          }, 3000);
        },
        onError: (err: string) => {
          setEditError(err);
          setIsEditing(false);
        },
      }
    );
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSubmit();
    }
  };

  // ── Save & Deploy ──────────────────────────────────────────
  const handleDeployOpen = () => {
    setShowDeployModal(true);
    setDeploySuccess(false);
    setDeployedUrl('');
    if (!pageName && website) {
      const auto = toSlug(website.name);
      setPageName(auto);
      setPageSlug(auto);
    }
  };

  const handlePageNameChange = (value: string) => {
    setPageName(value);
    setPageSlug(toSlug(value));
  };

  const handleDeploy = () => {
    if (!pageSlug || !website || !user) return;
    dbStorage.update(website.id, user.id, { page_name: pageSlug, deployed_at: new Date().toISOString() });
    const url = `${window.location.origin}/websites/${website.id}/${pageSlug}`;
    setDeployedUrl(url);
    setDeploySuccess(true);
  };

  const copyDeployedUrl = async () => {
    await navigator.clipboard.writeText(deployedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const goToDeployed = () => {
    if (!website || !pageSlug) return;
    navigate(`/websites/${website.id}/${pageSlug}`);
  };

  // ── Not found ──────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Website Not Found</h2>
        <p className="text-text-muted mb-6 max-w-sm">
          Website dengan ID <code className="text-accent-glow font-mono text-sm">{id}</code> tidak ditemukan.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
        >
          <ArrowLeft size={14} /> Back to CobasiteAI
        </button>
      </div>
    );
  }

  if (!website) return null;

  const currentViewport = viewportSizes[viewportMode];
  const linesTotal = website.source_code.split('\n').length;

  return (
    <div className={`flex flex-col h-screen bg-base ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!fullscreen && (
          <motion.header
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-base-50 flex-shrink-0"
          >
            {/* Back */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
            >
              <ArrowLeft size={12} /> Back
            </button>

            {/* Website switcher */}
            <div className="relative">
              <button
                onClick={() => setShowSwitcher((s) => !s)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-100 hover:bg-base-200 text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded-md bg-accent-muted flex items-center justify-center">
                  <Globe size={10} className="text-accent-glow" />
                </div>
                <span className="font-semibold text-text-primary max-w-[180px] truncate">{website.name}</span>
                <span className="text-text-muted">▾</span>
              </button>
              <AnimatePresence>
                {showSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    className="absolute top-full left-0 mt-1.5 w-72 bg-base-50 border border-surface-border rounded-xl shadow-card-hover overflow-hidden z-50"
                  >
                    <div className="px-3 py-2 border-b border-surface-border">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Switch Website</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {allWebsites.map((site) => (
                        <button
                          key={site.id}
                          onClick={() => switchWebsite(site.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover transition-colors ${site.id === id ? 'bg-accent-muted' : ''}`}
                        >
                          <div className="w-6 h-6 rounded bg-base-200 flex items-center justify-center flex-shrink-0">
                            <Globe size={10} className={site.id === id ? 'text-accent-glow' : 'text-text-muted'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${site.id === id ? 'text-accent-glow' : 'text-text-primary'}`}>{site.name}</p>
                            <p className="text-xs text-text-muted font-mono truncate">{site.id}</p>
                          </div>
                          {site.id === id && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Viewport controls */}
            <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-base-100 border border-surface-border mx-auto">
              {([
                { mode: 'desktop', icon: Monitor },
                { mode: 'tablet', icon: Tablet },
                { mode: 'mobile', icon: Smartphone },
              ] as const).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewportMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewportMode === mode ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-base-200'
                  }`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{viewportSizes[mode].label}</span>
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button onClick={handleRefresh} className="p-2 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors" title="Refresh">
                <RefreshCw size={13} />
              </button>

              <button
                onClick={() => {
                  if (showCode && codePanelTab === 'edit') handleManualDiscard();
                  setShowCode((s) => !s);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showCode ? 'bg-accent-muted text-accent-glow' : 'bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary'
                }`}
                title="View / Edit Code"
              >
                <Code2 size={13} />
              </button>

              <button onClick={copyCode} className="p-2 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors" title="Copy HTML">
                {copied ? <Check size={13} className="text-teal-accent" /> : <Copy size={13} />}
              </button>
              <button onClick={openInNewTab} className="p-2 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors" title="Open in New Tab">
                <ExternalLink size={13} />
              </button>
              <button onClick={() => setFullscreen((f) => !f)} className="p-2 rounded-lg bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors" title="Fullscreen">
                {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>

              <button
                onClick={openManualEditor}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary border-surface-border"
                title="Edit code manually"
              >
                <Pencil size={12} />
                <span className="hidden sm:inline">Edit Code</span>
              </button>

              <button
                onClick={handleEditOpen}
                className={`flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  showEditPanel
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                    : 'bg-base-100 hover:bg-base-200 text-text-muted hover:text-text-primary border-surface-border'
                }`}
              >
                <Wand2 size={12} />
                <span className="hidden sm:inline">Ask AI</span>
              </button>

              <button
                onClick={handleDeployOpen}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
              >
                <Rocket size={12} />
                <span className="hidden sm:inline">Deploy</span>
              </button>

              <button
                onClick={downloadHTML}
                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white bg-base-100 hover:bg-base-200 border border-surface-border transition-all"
              >
                ↓ Download
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative flex-col">
        <div className="flex-1 flex overflow-hidden relative">

          {/* Iframe */}
          <div
            className={`flex-1 flex items-start justify-center overflow-auto bg-zinc-900 transition-all ${showCode ? 'w-1/2' : 'w-full'}`}
            style={{ padding: viewportMode !== 'desktop' ? '24px' : '0' }}
          >
            <div
              className="relative transition-all duration-300 bg-white"
              style={{
                width: currentViewport.width,
                minHeight: '100%',
                boxShadow: viewportMode !== 'desktop' ? '0 8px 40px rgba(0,0,0,0.6)' : 'none',
                borderRadius: viewportMode !== 'desktop' ? '12px' : '0',
                overflow: 'hidden',
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-50 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs text-text-muted">Loading preview…</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                className="w-full border-0"
                style={{ height: viewportMode !== 'desktop' ? '812px' : '100vh', display: 'block' }}
                title={`Preview: ${website.name}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>

          {/* ── Code panel ──────────────────────────────────── */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-surface-border bg-base-50 overflow-hidden flex flex-col"
              >
                {/* Code panel header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-base-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-base-200">
                        <button
                          onClick={() => setCodePanelTab('view')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            codePanelTab === 'view' ? 'bg-base-50 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <Eye size={11} /> View
                        </button>
                        <button
                          onClick={openManualEditor}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            codePanelTab === 'edit' ? 'bg-base-50 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center">
                          <Terminal size={10} className="text-violet-400" />
                        </div>
                        <span className="text-xs font-semibold text-violet-300">AI Editing…</span>
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                        <Code2 size={11} />
                        <span>source.html</span>
                        <span>·</span>
                        <span>{linesTotal.toLocaleString()} lines</span>
                        {diffStats && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400">+{diffStats.added}</span>
                            <span className="text-red-400">−{diffStats.removed}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && codePanelTab === 'view' && (
                    <button onClick={copyCode} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                {/* ── Panel body ─────────────────────────────── */}
                <div className="flex-1 overflow-hidden flex flex-col">

                  {/* AI EDIT: Streaming panel */}
                  {isEditing && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#080b12]">
                      {patches.length > 0 && (
                        <div className="border-b border-white/5 px-4 py-3 flex-shrink-0 max-h-52 overflow-y-auto">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Zap size={9} className="text-violet-400" />
                            Changes Applied
                          </p>
                          <div className="space-y-1.5">
                            {patches.map((p, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-start gap-2"
                              >
                                {p.success ? (
                                  <CheckCircle size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle size={11} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                                )}
                                <span className={`text-xs leading-relaxed ${p.success ? 'text-text-muted' : 'text-red-400/60'}`}>
                                  {p.description}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-auto px-4 py-3 font-mono">
                        <p className="text-[10px] text-violet-400/50 mb-2 uppercase tracking-widest">
                          ▸ AI patch stream
                        </p>
                        <pre className="text-[11px] leading-relaxed text-emerald-400/70 whitespace-pre-wrap break-all">
                          {streamingRaw || <span className="text-violet-400/40 animate-pulse">Generating patches…</span>}
                        </pre>
                        <div ref={streamingEndRef} />
                      </div>
                    </div>
                  )}

                  {/* VIEW mode */}
                  {!isEditing && codePanelTab === 'view' && (
                    <pre className="flex-1 overflow-auto text-xs font-mono leading-relaxed text-text-code p-4">
                      <code>{website.source_code}</code>
                    </pre>
                  )}

                  {/* EDIT mode */}
                  {!isEditing && codePanelTab === 'edit' && (
                    <>
                      <textarea
                        ref={codeTextareaRef}
                        value={manualEditValue}
                        onChange={(e) => setManualEditValue(e.target.value)}
                        spellCheck={false}
                        className="flex-1 w-full p-4 font-mono text-xs leading-relaxed text-text-code bg-transparent resize-none focus:outline-none"
                        placeholder="Edit HTML code here…"
                        style={{ tabSize: 2 }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = e.currentTarget.selectionStart;
                            const end = e.currentTarget.selectionEnd;
                            const val = e.currentTarget.value;
                            const newVal = val.slice(0, start) + '  ' + val.slice(end);
                            setManualEditValue(newVal);
                            setTimeout(() => {
                              e.currentTarget.selectionStart = start + 2;
                              e.currentTarget.selectionEnd = start + 2;
                            }, 0);
                          }
                          if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleManualSave();
                          }
                        }}
                      />

                      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-surface-border bg-base-100 flex-shrink-0">
                        <span className="text-xs text-text-muted flex-1">
                          {manualEditValue.split('\n').length.toLocaleString()} lines · ⌘S to save
                        </span>
                        <button
                          onClick={handleManualDiscard}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary bg-base-200 hover:bg-base-300 transition-colors"
                        >
                          <RotateCcw size={11} /> Discard
                        </button>
                        <button
                          onClick={handleManualSave}
                          disabled={!manualEditValue.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                          style={{ background: manualSaved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
                        >
                          {manualSaved ? (
                            <><Check size={11} /> Saved!</>
                          ) : (
                            <><Save size={11} /> Save & Apply</>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fullscreen close */}
          {fullscreen && (
            <button
              onClick={() => setFullscreen(false)}
              className="fixed top-4 right-4 z-50 p-2.5 rounded-xl glass text-text-muted hover:text-text-primary transition-colors"
            >
              <Minimize2 size={16} />
            </button>
          )}
        </div>

        {/* ── Ask AI Panel (bottom drawer) ──────────────────── */}
        <AnimatePresence>
          {showEditPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="border-t border-surface-border bg-base-50 overflow-hidden flex-shrink-0"
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Wand2 size={11} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-text-primary">Ask AI to Edit</span>
                    {!isEditing && (
                      <span className="text-xs text-text-muted hidden sm:inline">
                        — describe the change, AI applies it surgically
                      </span>
                    )}
                    {isEditing && (
                      <span className="text-xs text-violet-300/70 hidden sm:inline">
                        — {patches.length} change{patches.length !== 1 ? 's' : ''} applied so far
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowEditPanel(false); setEditError(''); }}
                    className="p-1.5 rounded-lg hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors"
                    disabled={isEditing}
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={editTextareaRef}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      disabled={isEditing}
                      placeholder="e.g. Change the hero headline to 'Build Faster', make the CTA button green, add a testimonials section below features…"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm text-text-primary bg-base-100 border border-surface-border rounded-xl resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-text-muted/50 disabled:opacity-50 transition-all"
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-text-muted/40 pointer-events-none select-none">⌘↵</span>
                  </div>

                  <button
                    onClick={handleEditSubmit}
                    disabled={!editPrompt.trim() || isEditing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
                  >
                    {isEditing ? (
                      <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Editing…</span></>
                    ) : editSuccess ? (
                      <><CheckCircle2 size={13} className="text-green-300" /><span className="hidden sm:inline">Done!</span></>
                    ) : (
                      <><Send size={13} /><span className="hidden sm:inline">Apply</span></>
                    )}
                  </button>
                </div>

                {editSuccess && diffStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-3 text-xs"
                  >
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      {patches.filter(p => p.success).length} change{patches.filter(p => p.success).length !== 1 ? 's' : ''} applied
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-emerald-400">+{diffStats.added} lines</span>
                    <span className="text-red-400">−{diffStats.removed} lines</span>
                  </motion.div>
                )}

                {editError && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertTriangle size={11} /> {editError}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Save & Deploy Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showDeployModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeployModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-4 rounded-2xl border border-surface-border bg-base-50 shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 border-b border-surface-border flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C5CFC22, #5A3DE822)' }}>
                    <Rocket size={18} className="text-accent-glow" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-base">Save & Deploy</h3>
                    <p className="text-xs text-text-muted mt-0.5">Give your page a public URL</p>
                  </div>
                </div>
                <button onClick={() => setShowDeployModal(false)} className="p-1.5 rounded-lg hover:bg-base-200 text-text-muted transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="px-6 py-5">
                {!deploySuccess ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Page Name</label>
                      <input
                        type="text"
                        value={pageName}
                        onChange={(e) => handlePageNameChange(e.target.value)}
                        placeholder="e.g. My Landing Page"
                        className="w-full px-3.5 py-2.5 text-sm text-text-primary bg-base-100 border border-surface-border rounded-xl focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-text-muted/50 transition-all"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleDeploy(); }}
                      />
                    </div>
                    <div className="mb-5 px-3.5 py-3 rounded-xl bg-base-100 border border-surface-border">
                      <p className="text-xs text-text-muted mb-1 font-medium">Preview URL</p>
                      <p className="text-xs font-mono text-text-primary break-all leading-relaxed">
                        <span className="text-text-muted">{window.location.origin}/websites/{id}/</span>
                        <span className={pageSlug ? 'text-accent-glow font-semibold' : 'text-text-muted/40'}>
                          {pageSlug || 'your-page-name'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleDeploy}
                      disabled={!pageSlug}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
                    >
                      <Rocket size={14} /> Deploy Now
                    </button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={28} className="text-green-400" />
                    </div>
                    <h4 className="font-semibold text-text-primary mb-1">Deployed! 🎉</h4>
                    <p className="text-xs text-text-muted mb-4">Your website is now live at:</p>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-base-100 border border-surface-border mb-4">
                      <Link2 size={12} className="text-accent-glow flex-shrink-0" />
                      <span className="text-xs font-mono text-text-primary truncate flex-1 text-left">{deployedUrl}</span>
                      <button onClick={copyDeployedUrl} className="flex-shrink-0 p-1 rounded hover:bg-base-200 text-text-muted hover:text-text-primary transition-colors">
                        {copiedUrl ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeployModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted bg-base-100 hover:bg-base-200 border border-surface-border transition-colors">
                        Close
                      </button>
                      <button
                        onClick={goToDeployed}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #7C5CFC, #5A3DE8)' }}
                      >
                        <ExternalLink size={12} /> Open Page
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}