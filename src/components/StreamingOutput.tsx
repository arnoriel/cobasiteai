import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, CheckCircle2, AlertCircle, Eye, Copy, Check } from 'lucide-react';
import type { GenerationStatus, Website } from '../types';

interface StreamingOutputProps {
  status: GenerationStatus;
  streamedCode: string;
  currentWebsite: Website | null;
  onPreview: (id: string) => void;
  errorMessage?: string;
}

const statusConfig = {
  idle: null,
  thinking: { label: 'AI is thinking…', color: 'text-amber-400', dot: 'bg-amber-400' },
  streaming: { label: 'Generating website code…', color: 'text-accent-glow', dot: 'bg-accent-glow' },
  done: { label: 'Website generated successfully!', color: 'text-teal-accent', dot: 'bg-teal-accent' },
  error: { label: 'Generation failed', color: 'text-red-400', dot: 'bg-red-400' },
};

export default function StreamingOutput({
  status,
  streamedCode,
  currentWebsite,
  onPreview,
  errorMessage,
}: StreamingOutputProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && status === 'streaming') {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamedCode, status]);

  const copyCode = async () => {
    if (!streamedCode) return;
    await navigator.clipboard.writeText(streamedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'idle') return null;
  const cfg = statusConfig[status];

  const lineCount = streamedCode ? streamedCode.split('\n').length : 0;
  const charCount = streamedCode ? streamedCode.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden bg-base-50 border border-surface-border shadow-card"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-base-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>

          {cfg && (
            <div className="flex items-center gap-2 ml-2">
              {status === 'done' ? (
                <CheckCircle2 size={13} className="text-teal-accent" />
              ) : status === 'error' ? (
                <AlertCircle size={13} className="text-red-400" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
              )}
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {streamedCode && (
            <>
              <span className="text-xs text-text-muted font-mono">
                {lineCount} Lines · {charCount.toLocaleString()} Chars
              </span>

              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 text-text-muted hover:text-text-secondary text-xs transition-colors"
              >
                {copied ? <Check size={11} className="text-teal-accent" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}

          {status === 'done' && currentWebsite && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPreview(currentWebsite.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7C5CFC 0%, #00E5D4 100%)' }}
            >
              <Eye size={11} />
              Open Preview
            </motion.button>
          )}
        </div>
      </div>

      {/* Code file tab */}
      {streamedCode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-base-50 border-b border-surface-border">
          <Code2 size={12} className="text-text-muted" />
          <span className="text-xs font-mono text-text-muted">
            {currentWebsite ? currentWebsite.id + '.html' : 'index.html'}
          </span>
          {status === 'streaming' && (
            <span className="ml-auto text-xs font-mono text-accent-glow">
              writing<span className="cursor-blink">▋</span>
            </span>
          )}
        </div>
      )}

      {/* Code content */}
      <div className="relative max-h-[420px] overflow-hidden">
        {status === 'thinking' ? (
          <div className="flex flex-col gap-3 p-6">
            {[80, 60, 90, 50, 70].map((w, i) => (
              <div
                key={i}
                className="shimmer h-3 rounded"
                style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : status === 'error' ? (
          <div className="flex items-start gap-3 p-5">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Generation Failed</p>
              <p className="text-xs text-text-muted mt-1">{errorMessage}</p>
            </div>
          </div>
        ) : (
          <pre
            ref={codeRef}
            className="overflow-y-auto overflow-x-auto text-xs font-mono leading-relaxed text-text-code p-4"
            style={{ maxHeight: 420, tabSize: 2 }}
          >
            <code>{streamedCode}</code>
            {status === 'streaming' && (
              <span className="cursor-blink text-accent-glow">▋</span>
            )}
          </pre>
        )}

        {/* Bottom fade gradient */}
        {streamedCode && status === 'streaming' && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-base-50 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Done footer */}
      <AnimatePresence>
        {status === 'done' && currentWebsite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-surface-border px-4 py-3 bg-teal-muted/30 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-accent" />
                <span className="text-sm font-semibold text-text-primary">
                  {currentWebsite.name}
                </span>
                <span className="text-xs text-text-muted font-mono">
                  · {currentWebsite.id}
                </span>
              </div>
              <button
                onClick={() => onPreview(currentWebsite.id)}
                className="text-xs text-accent-glow hover:underline"
              >
                Preview →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
