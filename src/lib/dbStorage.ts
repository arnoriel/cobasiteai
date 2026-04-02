import { supabase } from './supabase';
import type { Website } from '../types';

// Maps Supabase DB row → local Website type
function rowToWebsite(row: Record<string, unknown>): Website {
  return {
    id: row.id as string,
    name: row.name as string,
    prompt: row.prompt as string,
    source_code: row.source_code as string,
    created_at: row.created_at as string,
    page_name: (row.page_name as string | null) ?? undefined,
    deployed_at: (row.deployed_at as string | null) ?? undefined,
  };
}

export const dbStorage = {
  async getAll(userId: string): Promise<Website[]> {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAll error:', error);
      return [];
    }
    return (data ?? []).map(rowToWebsite);
  },

  async getById(id: string, userId: string): Promise<Website | null> {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)   // ← enforce ownership
      .single();

    if (error || !data) return null;
    return rowToWebsite(data);
  },

  async getByPageName(pageName: string): Promise<Website | null> {
    // page_name is globally unique but we don't need user_id here
    // because this is used for public page sharing
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('page_name', pageName)
      .single();

    if (error || !data) return null;
    return rowToWebsite(data);
  },

  async save(website: Website, userId: string): Promise<void> {
    const { error } = await supabase
      .from('websites')
      .upsert({
        id: website.id,
        user_id: userId,
        name: website.name,
        prompt: website.prompt,
        source_code: website.source_code,
        page_name: website.page_name ?? null,
        deployed_at: website.deployed_at ?? null,
      });

    if (error) console.error('save error:', error);
  },

  async update(id: string, userId: string, data: Partial<Website>): Promise<void> {
    // Only allow updating own websites
    const { error } = await supabase
      .from('websites')
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.source_code !== undefined && { source_code: data.source_code }),
        ...(data.page_name !== undefined && { page_name: data.page_name }),
        ...(data.deployed_at !== undefined && { deployed_at: data.deployed_at }),
      })
      .eq('id', id)
      .eq('user_id', userId);  // ← enforce ownership

    if (error) console.error('update error:', error);
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);  // ← enforce ownership

    if (error) console.error('delete error:', error);
  },

  generateId(): string {
    return `site_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  // ── Credits ────────────────────────────────────────────────────────────────

  /** Deduct 1 credit. Returns false if user has no credits left. */
  async useCredit(userId: string): Promise<boolean> {
    // Use a Postgres RPC to atomically check & decrement
    const { data, error } = await supabase.rpc('use_credit', { p_user_id: userId });
    if (error) {
      console.error('useCredit error:', error);
      return false;
    }
    return data as boolean; // RPC returns true if credit was deducted, false if none left
  },
};
