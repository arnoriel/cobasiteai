import type { Website } from '../types';

const STORAGE_KEY = 'cobasiteai_websites';

export const storage = {
  getAll(): Website[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getById(id: string): Website | null {
    return this.getAll().find((w) => w.id === id) ?? null;
  },

  getByPageName(page_name: string): Website | null {
    return this.getAll().find((w) => w.page_name === page_name) ?? null;
  },

  save(website: Website): void {
    const all = this.getAll().filter((w) => w.id !== website.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([website, ...all]));
  },

  update(id: string, data: Partial<Website>): void {
    const all = this.getAll().map((w) =>
      w.id === id ? { ...w, ...data } : w
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  delete(id: string): void {
    const all = this.getAll().filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },

  generateId(): string {
    return `site_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },
};