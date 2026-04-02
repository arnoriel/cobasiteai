import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Key, Wand2 } from 'lucide-react';
import type { GenerationStatus } from '../types';
import { ENV } from '../lib/env';

const PROMPT_SUGGESTIONS = [
  'Landing page untuk startup fintech dengan tema gelap elegan, menggunakan font Sora, warna biru elektrik & emas, ada hero section dengan animasi particles, fitur grid, dan pricing table',
  'Website portofolio fotografer dengan aesthetic film noir hitam putih, font Playfair Display, galeri masonry grid, smooth hover effects, dan kontak form minimalis',
  'SaaS dashboard landing page dengan tema cyberpunk neon, warna hijau lime & ungu gelap, glassmorphism cards, animated stats counter, dan futuristic typography',
  'Restaurant website mewah dengan tema Japandi, warna cream & charcoal, font Cormorant Garamond, full-screen hero video placeholder, menu grid yang elegan',
  'Agency kreatif dengan aesthetic brutalist bold, warna hitam putih & merah menyala, Typography besar-besar, grid layout tidak biasa, dan hover effects yang dramatis',
];

interface PromptInputProps {
  onSubmit: (prompt: string, apiKey: string) => void;
  status: GenerationStatus;
  creditsLeft: number;
}

export default function PromptInput({ onSubmit, status, creditsLeft }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => ENV.apiKey ?? localStorage.getItem('cobasiteai_api_key') ?? '');
  const [showApiInput] = useState(!ENV.hasEnvKey && !localStorage.getItem('cobasiteai_api_key'));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isGenerating = status === 'thinking' || status === 'streaming';
  const noCredits = creditsLeft <= 0;

  useEffect(() => {
    if (apiKey) localStorage.setItem('cobasiteai_api_key', apiKey);
  }, [apiKey]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating || noCredits) return;
    if (!apiKey.trim() && !ENV.hasEnvKey) return;
    onSubmit(prompt.trim(), apiKey.trim());
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const applySuggestion = (s: string) => {
    setPrompt(s);
    setShowSuggestions(false);
    textareaRef.current?.focus();
    setTimeout(autoResize, 10);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* API Key Row */}
      <AnimatePresence>
        {showApiInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-base-100 border border-surface-border">
              <Key size={14} className="text-text-muted flex-shrink-0" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="OpenRouter API Key (sk-or-...)"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
              />
              {apiKey && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-accent" />
                  <span className="text-xs text-teal-accent">Saved</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <div className={`relative rounded-2xl bg-base-100 border transition-colors shadow-card ${
        noCredits
          ? 'border-red-500/30 opacity-60'
          : 'border-surface-border focus-within:border-accent/50'
      }`}>
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Wand2 size={13} className="text-accent-glow" />
            <span className="text-xs font-medium text-text-muted">
              {noCredits ? '⚠️ Credit habis – tunggu reset jam 7 pagi' : 'Website Prompt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuggestions((s) => !s)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 text-text-muted hover:text-text-secondary text-xs transition-colors"
            >
              <Sparkles size={10} />
              Ideas
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          disabled={isGenerating || noCredits}
          placeholder={
            noCredits
              ? 'Credit habis. Reset setiap hari jam 7 pagi.'
              : "Deskripsikan website impianmu... misalnya: 'Buat landing page untuk agency desain premium dengan tema monochrome, font editorial, hero full screen dengan typo besar-besar, dan grid portofolio cinematic'"
          }
          rows={3}
          className="w-full bg-transparent text-text-primary placeholder-text-muted text-sm leading-relaxed px-4 py-2 resize-none outline-none disabled:opacity-50"
          style={{ minHeight: 80, maxHeight: 200 }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-border">
          <div className="flex items-center gap-2">
            {prompt.length > 0 && (
              <span className="text-xs text-text-muted">{prompt.length} chars</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted hidden sm:block">⌘↵ to send</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!prompt.trim() || (!apiKey.trim() && !ENV.hasEnvKey) || isGenerating || noCredits}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  !prompt.trim() || (!apiKey.trim() && !ENV.hasEnvKey) || isGenerating || noCredits
                    ? undefined
                    : 'linear-gradient(135deg, #7C5CFC 0%, #5A3DE8 100%)',
                backgroundColor:
                  !prompt.trim() || !apiKey.trim() || isGenerating || noCredits
                    ? '#1E2338'
                    : undefined,
                color:
                  !prompt.trim() || !apiKey.trim() || isGenerating || noCredits ? '#4A5070' : '#fff',
              }}
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={13} />
                  Generate
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-base-50 border border-surface-border overflow-hidden"
          >
            <div className="px-4 py-2.5 border-b border-surface-border">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                ✦ Prompt Ideas
              </p>
            </div>
            <div className="flex flex-col divide-y divide-surface-border">
              {PROMPT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(s)}
                  className="w-full text-left px-4 py-3 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors leading-relaxed"
                >
                  <span className="text-accent-glow mr-2">→</span>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
