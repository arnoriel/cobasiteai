/**
 * Environment config — reads from Vite env vars (set in .env or Vercel dashboard)
 * Prefix VITE_ is required for Vite to expose vars to the browser bundle.
 *
 * Priority for API key:
 *   1. VITE_OPENROUTER_API_KEY (env / Vercel)
 *   2. Manual input saved in localStorage (fallback for local dev)
 */

export const ENV = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined,
  model: (import.meta.env.VITE_AI_MODEL as string | undefined) ?? 'qwen/qwen3.6-plus-preview:free',
  /** true if the API key is baked in via env — hide the key input from UI */
  hasEnvKey: Boolean(import.meta.env.VITE_OPENROUTER_API_KEY),
} as const;
