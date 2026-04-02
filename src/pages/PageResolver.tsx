import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { dbStorage } from '../lib/dbStorage';
import type { Website } from '../types';

export default function PageResolver() {
  const { page_name } = useParams<{ page_name: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [website, setWebsite] = useState<Website | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!page_name) { setNotFound(true); return; }
    dbStorage.getByPageName(page_name).then((site) => {
      if (!site) { setNotFound(true); return; }
      setWebsite(site);
    });
  }, [page_name]);

  useEffect(() => {
    if (!website?.source_code || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(website.source_code);
      doc.close();
    }
    const titleMatch = website.source_code.match(/<title[^>]*>([^<]*)<\/title>/i);
    document.title = titleMatch?.[1]?.trim() ?? website.name ?? page_name ?? 'Page';
  }, [website, page_name]);

  const handleIframeLoad = () => setIsLoading(false);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-muted mb-6 max-w-sm text-sm">
          No page named <code className="text-accent-glow font-mono">/{page_name}</code> was found.
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

  if (!website) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">Loading page…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
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
  );
}
