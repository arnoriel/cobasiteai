import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Trash2,
  Eye,
  Calendar,
  ChevronRight,
  Code2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type { Website } from '../types';
import { dbStorage } from '../lib/dbStorage';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  websites: Website[];
  activeId?: string;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export default function Sidebar({
  websites,
  activeId,
  onSelect,
  onPreview,
  onDelete,
  onRefresh,
}: SidebarProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      if (user) await dbStorage.delete(id, user.id);
      onDelete(id);
      setConfirmDelete(null);
      onRefresh?.();
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2500);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-base-50 border-r border-surface-border overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-surface-border">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded bg-accent-muted flex items-center justify-center">
                <Code2 size={12} className="text-accent-glow" />
              </div>
              <span className="font-display font-semibold text-sm text-text-primary">
                My Websites
              </span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-muted text-accent-glow text-xs font-mono">
                {websites.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors ml-auto"
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Website List */}
      <div className="flex-1 overflow-y-auto py-2">
        {websites.length === 0 ? (
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 px-4 py-12 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center">
                  <Globe size={20} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">No websites yet</p>
                  <p className="text-text-muted text-xs mt-1">Describe your dream site and let AI build it</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-0.5 px-2">
            {websites.map((site, i) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoverId(site.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`relative group rounded-lg cursor-pointer transition-all duration-200 ${
                  activeId === site.id
                    ? 'bg-accent-muted border border-accent/30'
                    : 'hover:bg-surface-hover border border-transparent'
                }`}
              >
                {collapsed ? (
                  <button
                    onClick={() => onSelect(site.id)}
                    className="w-full flex items-center justify-center p-3"
                    title={site.name}
                  >
                    <Globe
                      size={16}
                      className={activeId === site.id ? 'text-accent-glow' : 'text-text-muted'}
                    />
                  </button>
                ) : (
                  <div className="p-2.5">
                    <button onClick={() => onSelect(site.id)} className="w-full text-left">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${activeId === site.id ? 'bg-accent/20' : 'bg-base-200'}`}>
                          <Globe size={12} className={activeId === site.id ? 'text-accent-glow' : 'text-text-muted'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate leading-tight">{site.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar size={9} className="text-text-muted" />
                            <span className="text-xs text-text-muted truncate">{formatDate(site.created_at)}</span>
                          </div>
                        </div>
                        <ChevronRight size={12} className={`text-text-muted transition-transform flex-shrink-0 mt-1 ${activeId === site.id ? 'rotate-90 text-accent-glow' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {(hoverId === site.id || activeId === site.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-1 mt-2 pt-2 border-t border-surface-border overflow-hidden"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); onPreview(site.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-accent-muted hover:bg-accent/25 text-accent-glow text-xs font-medium transition-colors"
                          >
                            <Eye size={11} /> Preview
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }}
                            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              confirmDelete === site.id
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-base-200 hover:bg-red-500/15 text-text-muted hover:text-red-400'
                            }`}
                          >
                            <Trash2 size={11} />
                            {confirmDelete === site.id ? 'Sure?' : ''}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 border-t border-surface-border"
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-accent animate-pulse" />
              <span className="text-xs text-text-muted">Powered by Qwen3</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
