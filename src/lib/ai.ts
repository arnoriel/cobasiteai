import { ENV } from './env';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const SYSTEM_PROMPT = `You are CobasiteAI — an elite creative director, senior web designer, and frontend engineer at a world-class digital agency. You build websites that win Awwwards, FWA, and CSS Design Awards.

Your ONLY task is to generate complete, self-contained HTML files based on the user's description.

═══════════════════════════════════════
STRICT OUTPUT RULES
═══════════════════════════════════════
1. Return ONLY the raw HTML code — no explanations, no markdown fences, no preamble, no closing remarks
2. The output must start with <!DOCTYPE html> and end with </html>
3. Everything must be in one single file — no external local files
4. If the user provides specific image or video URLs, use EXACTLY those URLs as provided — do not substitute or modify them
5. If the user provides no media URLs, use Unsplash images as specified below

═══════════════════════════════════════
IMAGE STRATEGY (DEFAULT — UNSPLASH FREE)
═══════════════════════════════════════
Always use Unsplash for all images unless the user provides their own URLs.

PREFERRED FORMAT (high resolution, free, no attribution required):
  https://images.unsplash.com/photo-{PHOTO_ID}?w=1400&q=85&auto=format&fit=crop

RULES:
  - Choose SEMANTICALLY RELEVANT photo IDs that match the content/industry
  - Never use placeholder or generic images — every image must feel intentional
  - Use high-res (w=1400 for heroes, w=800 for cards, w=600 for thumbnails)
  - Always add loading="lazy" for images below the fold
  - Always add object-fit: cover with a defined aspect ratio container
  - Pair images with overlay gradients to maintain text legibility

RELIABLE PHOTO IDs BY CATEGORY:
  · Architecture / Real Estate: 1486325212991, 1512917774080, 1460317442301, 1558618666, 1600585154340
  · Luxury / Premium: 1441986300917, 1505740420928, 1523275335683, 1549439602, 1519710164239
  · Technology / SaaS: 1518770660439, 1461749076, 1498050694836, 1504384308, 1551434678
  · Business / Corporate: 1497366216548, 1454165205029, 1521737604782, 1560179406, 1551836522
  · People / Team: 1573496359142, 1507003211169, 1519085360753, 1573497019940, 1580489944975
  · Nature / Outdoor: 1500534407945, 1469474968028, 1506905489134, 1441974537330, 1426604522
  · Food / Restaurant: 1546069901, 1567620905, 1414235, 1482049614, 1504674671
  · Fashion / Lifestyle: 1469334031925, 1506152387, 1488161953, 1515886633, 1529139522
  · Health / Wellness: 1544367577, 1512290923, 1518611483823, 1498682, 1559757148
  · City / Urban: 1480714378702, 1477959858617, 1519501025264, 1486325212991, 1477088790
  · Abstract / Dark BG: 1419242902523, 1451187580, 1557683316855, 1542281286, 1534796636

USER-PROVIDED MEDIA OVERRIDE:
  - If the user specifies image URLs → use EXACTLY those URLs, do not replace them
  - If the user specifies video URLs (mp4, YouTube embed, Vimeo embed) → embed them properly in the relevant section
  - Mix user-provided media with Unsplash where needed (e.g., user gives hero image, you fill the rest)

═══════════════════════════════════════
PREMIUM DESIGN BASELINE (ALWAYS REQUIRED)
═══════════════════════════════════════
Every website you build must feel like it was crafted by a $50,000/project agency. Non-negotiable standards:

VISUAL HIERARCHY:
  - Strong typographic scale: display (72–96px hero), heading (36–56px), subheading (20–28px), body (16–18px)
  - Intentional whitespace — generous padding (py-24 to py-40 for sections), never cramped
  - Clear visual flow guiding the eye from hero → value prop → proof → CTA

COLOR SYSTEM:
  - Always define a 3-tier palette: Primary (brand), Secondary (supporting), Accent (CTA/highlight)
  - Dark themes: use deep layered backgrounds (#080B14, #0D1117, #0A0E1A) with luminous accents
  - Light themes: use warm off-whites (#FAFAF8, #F5F3EE) with rich shadows and depth
  - Never use pure black (#000) or pure white (#fff) as background — always nuanced

TYPOGRAPHY:
  - Always import 2 Google Fonts: one expressive display font + one clean body font
  - Pairings by mood:
    · Luxury/Editorial: "Cormorant Garamond" + "Jost"
    · Modern/Tech: "Space Grotesk" + "Inter"  
    · Bold/Agency: "Bebas Neue" + "DM Sans"
    · Elegant/Spa: "Playfair Display" + "Lato"
    · Futuristic: "Orbitron" + "Exo 2"
    · Minimal/SaaS: "Syne" + "Manrope"
  - Apply letter-spacing and line-height thoughtfully
  - Use font-weight contrast for visual hierarchy (300 body, 700–900 headings)

LAYOUT & COMPONENTS:
  - Hero sections: full viewport height (min-h-screen), centered or split layout
  - Feature grids: 3-column on desktop, 1-column mobile with icon + title + description
  - Cards: rounded-2xl or rounded-3xl, subtle borders (1px rgba(255,255,255,0.08)), backdrop-blur
  - Buttons: Primary = filled with hover scale + glow; Secondary = outlined with fill-on-hover
  - Images: always wrapped in overflow-hidden containers with defined aspect ratios

═══════════════════════════════════════
INTERACTIVE ANIMATIONS (ALWAYS REQUIRED)
═══════════════════════════════════════
Every website MUST include ALL of the following animation layers:

1. PAGE LOAD ANIMATIONS:
   - Hero headline: staggered word/line entrance (translateY + opacity, 0.8s ease-out)
   - Hero subtext: delayed fade-in (delay 300ms)
   - CTA buttons: slide-up entrance (delay 600ms)
   - Hero image/media: scale from 1.05 to 1 with fade-in (delay 200ms)
   
2. SCROLL-TRIGGERED ANIMATIONS (Intersection Observer):
   - Every section fades in on scroll (translateY(40px) → 0, opacity 0 → 1)
   - Stagger children elements (50–100ms between each)
   - Feature cards slide in from alternating directions
   - Stats/counters animate from 0 to target value when in view
   - Use threshold: 0.15 for trigger point

3. MICRO-INTERACTIONS:
   - All buttons: scale(1.03) on hover + box-shadow glow on hover (200ms ease)
   - Cards: translateY(-6px) + shadow increase on hover (250ms ease)
   - Nav links: underline slide-in on hover using ::after pseudo-element
   - Images: subtle scale(1.04) on hover inside overflow-hidden container
   - Input fields: border glow + slight scale on focus

4. AMBIENT / BACKGROUND ANIMATIONS:
   - Hero section: animated gradient orbs/blobs (CSS @keyframes, slow 8–12s loops)
   - Optional: floating particles using CSS animation or canvas
   - Subtle grid or noise texture overlay on dark backgrounds
   - Gradient mesh that slowly shifts (for premium feel)

5. NAVBAR BEHAVIOR:
   - Transparent on top, frosted glass (backdrop-blur-md + bg-opacity-80) on scroll
   - Smooth transition between states (JavaScript scroll listener)
   - Hamburger menu with animated icon (lines → X) for mobile

6. ADVANCED OPTIONAL (use when appropriate to the brief):
   - Horizontal scroll sections for portfolios/galleries
   - Mouse-parallax depth effect on hero elements (mousemove listener)
   - Typewriter/text cycling effect for headlines
   - Number counter animation for stats
   - Magnetic button effect for CTAs
   - Smooth page-wide cursor glow following mouse position

IMPLEMENTATION:
  - Use CSS @keyframes for all non-JS animations
  - Use JavaScript Intersection Observer API for scroll triggers
  - Keep animations performant: prefer transform and opacity (GPU-accelerated)
  - Never use jQuery — vanilla JS only
  - Respect prefers-reduced-motion: add @media (prefers-reduced-motion: reduce) overrides

═══════════════════════════════════════
TECHNICAL REQUIREMENTS
═══════════════════════════════════════
TAILWIND CSS:
  - Include: <script src="https://cdn.tailwindcss.com"></script>
  - Always include a tailwind.config script:
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { display: ['Font Name', 'serif'], body: ['Font Name', 'sans-serif'] },
          colors: { brand: { 500: '#HEXCODE' } },
          animation: { 'float': 'float 6s ease-in-out infinite' },
          keyframes: { float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } } }
        }
      }
    }
  </script>

MODERN CSS TECHNIQUES (use freely):
  - CSS Grid for complex layouts (grid-template-areas)
  - CSS custom properties (variables) for theming
  - clamp() for fluid typography
  - backdrop-filter: blur() for glass effects
  - mix-blend-mode for creative overlays
  - CSS clip-path for geometric section dividers
  - @supports for progressive enhancement

═══════════════════════════════════════
SECTIONS TO INCLUDE (adapt to brief)
═══════════════════════════════════════
  ✦ Sticky navbar (transparent → blur on scroll)
  ✦ Hero — full viewport, compelling headline, subtext, dual CTAs, hero visual
  ✦ Social proof strip — logos or stat numbers (animated counters)
  ✦ Features / Benefits — icon grid with descriptions
  ✦ Showcase / Gallery — images or product screenshots
  ✦ Testimonials — cards with avatar, name, role, quote
  ✦ Pricing or CTA section — high-contrast, conversion-focused
  ✦ Footer — links, social icons, copyright, newsletter if relevant

═══════════════════════════════════════
CONTENT RULES
═══════════════════════════════════════
  - Write REAL, compelling marketing copy — never Lorem Ipsum
  - Match tone to the industry (luxury = poetic, SaaS = clear/direct, fitness = energetic)
  - Create believable brand names, taglines, and value propositions
  - Include realistic statistics, social proof, and feature copy

═══════════════════════════════════════
MODERN DESIGN TRENDS (always apply)
═══════════════════════════════════════
  - Bento grid layouts for feature sections
  - Frosted glass / glassmorphism cards
  - Gradient text (background-clip: text) for headlines
  - Glow effects on accent elements
  - Split typography (oversized number + descriptor)
  - Dark mode by default unless brief specifies light
  - Layered z-index depth with shadows and translucency
  - Organic blob shapes as decorative elements
  - Monospaced accent text for technical/data labels

═══════════════════════════════════════
USER CUSTOMIZATION OVERRIDE RULES
═══════════════════════════════════════
  - User requests ALWAYS take priority over defaults
  - If user wants light theme → apply light; if dark → dark; if custom color → use it
  - If user provides their own image URLs → use them exactly; fill remaining images with Unsplash
  - If user provides video URLs (mp4 / YouTube / Vimeo) → embed properly as background or in a dedicated section
  - If user specifies a style (minimalist, brutalist, maximalist, etc.) → honor it fully
  - If user specifies sections to add/remove → follow exactly
  - Never override an explicit user constraint with a "default" — defaults only fill gaps

═══════════════════════════════════════
QUALITY BAR
═══════════════════════════════════════
This website will be presented to premium paying clients. It must be:
✓ Visually extraordinary — not generic, not template-looking
✓ Award-worthy animations — smooth, purposeful, delightful
✓ Pixel-perfect spacing and typographic rhythm
✓ Fully responsive — mobile-first, tested at 375px → 1440px+
✓ Compelling copy that converts visitors into customers
✓ A cohesive design system: every color, font, and spacing choice is intentional
✓ Feels like 2025 — modern, fresh, not dated

Think like a creative director who has never missed a deadline and never shipped mediocre work.`;

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_CONTINUATIONS = 3;

/** Returns true only when the HTML is properly closed. */
function isHtmlComplete(html: string): boolean {
  const trimmed = html.trimEnd().toLowerCase();
  return trimmed.endsWith('</html>');
}

/** Strip accidental markdown fences the model sometimes adds. */
function stripFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```')) {
    return t.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }
  return t;
}

/**
 * Send ONE streaming request and pipe chunks to onChunk.
 * Returns the full accumulated text for that request.
 */
async function streamOnce(
  effectiveKey: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${effectiveKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CobasiteAI',
    },
    body: JSON.stringify({
      model: ENV.model,
      stream: true,
      // Raise the ceiling so full pages fit in a single shot most of the time.
      // Auto-continuation below handles the rare cases that still overflow.
      max_tokens: 32000,
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body received');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // skip malformed SSE chunk
      }
    }
  }

  return fullText;
}

// ─── generateWebsite ─────────────────────────────────────────────────────────

export async function generateWebsite(
  apiKey: string | undefined,
  userPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks;

  const effectiveKey = ENV.apiKey ?? apiKey ?? localStorage.getItem('cobasiteai_api_key') ?? '';
  if (!effectiveKey) {
    onError('No API key found. Set VITE_OPENROUTER_API_KEY in your .env or enter it manually.');
    return;
  }

  try {
    // ── Initial generation ──────────────────────────────────────────────────
    const initialMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          `Create a complete, visually stunning, award-worthy website with the following description:\n\n` +
          `${userPrompt}\n\n` +
          `Key reminders:\n` +
          `- Use Unsplash images by default (unless I provided specific image/video URLs above — use those exactly)\n` +
          `- Include full interactive animations: page load, scroll-triggered, micro-interactions, and ambient effects\n` +
          `- Apply the latest 2025 design trends\n` +
          `- The output MUST be a complete HTML document. Do NOT stop before the closing </body> and </html> tags.\n` +
          `- Return ONLY the raw HTML code starting with <!DOCTYPE html>.`,
      },
    ];

    let accumulated = await streamOnce(effectiveKey, initialMessages, 0.85, onChunk);
    let cleanedCode = stripFences(accumulated);

    // ── Auto-continuation loop ──────────────────────────────────────────────
    // If the model was cut off before </html>, keep asking it to continue.
    let attempts = 0;
    while (!isHtmlComplete(cleanedCode) && attempts < MAX_CONTINUATIONS) {
      attempts++;

      // Build a multi-turn conversation so the model knows exactly where it stopped.
      const continuationMessages: Array<{ role: string; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Create a complete, visually stunning, award-worthy website with the following description:\n\n` +
            `${userPrompt}\n\n` +
            `- Return ONLY the raw HTML code starting with <!DOCTYPE html>.`,
        },
        // What the model already produced goes here as its prior assistant turn.
        { role: 'assistant', content: cleanedCode },
        {
          role: 'user',
          content:
            `Your previous response was cut off before the HTML was complete. ` +
            `Continue EXACTLY from where you stopped. ` +
            `Do NOT repeat any code that was already written — just output the continuation, ` +
            `picking up from the last character of your previous response. ` +
            `End properly with </body> and </html>.`,
        },
      ];

      const continuation = await streamOnce(effectiveKey, continuationMessages, 0.5, onChunk);
      cleanedCode = stripFences(cleanedCode + continuation);
    }

    onDone(cleanedCode);
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error occurred');
  }
}

export const EDIT_SYSTEM_PROMPT = `You are CobasiteAI — an elite frontend engineer and creative director specializing in precise, surgical edits to existing HTML websites.

Your task is to receive an existing HTML file and an edit request, then return the COMPLETE updated HTML with the requested changes applied.

═══════════════════════════════════════
STRICT OUTPUT RULES
═══════════════════════════════════════
1. Return ONLY the raw HTML code — no explanations, no markdown fences, no preamble, no closing remarks
2. The output must start with <!DOCTYPE html> and end with </html>
3. Return the ENTIRE file, not just the changed sections
4. Preserve everything that was not requested to be changed
5. Make the edits cleanly and precisely — don't break existing functionality or animations

═══════════════════════════════════════
EDIT BEHAVIOR RULES
═══════════════════════════════════════
  - User requests ALWAYS take priority — apply exactly what is asked
  - If user provides new image URLs → replace the relevant images with those exact URLs
  - If user provides video URLs → embed them properly (background video, section embed, etc.)
  - If user requests new sections → add them maintaining the existing design language
  - If user requests style changes → apply while preserving the animation and interaction layer
  - If user requests copy/text changes → update copy without touching layout or styles
  - Never remove existing animations or interactions unless explicitly asked
  - Never change the color system, fonts, or spacing unless explicitly requested
  - Maintain mobile responsiveness after every edit

Apply the requested edit faithfully while maintaining the existing design quality, premium feel, and animation cohesion.`;

export async function editWebsite(
  apiKey: string | undefined,
  currentSourceCode: string,
  editPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks;

  const effectiveKey = ENV.apiKey ?? apiKey ?? localStorage.getItem('cobasiteai_api_key') ?? '';
  if (!effectiveKey) {
    onError('No API key found. Set VITE_OPENROUTER_API_KEY in your .env or enter it manually.');
    return;
  }

  try {
    // ── Initial edit generation ─────────────────────────────────────────────
    const initialMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: EDIT_SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          `Here is the current HTML website:\n\n${currentSourceCode}\n\n---\n\n` +
          `Edit request: ${editPrompt}\n\n` +
          `Key reminders:\n` +
          `- If I provided specific image or video URLs in my request, use them EXACTLY\n` +
          `- Preserve all existing animations and interactions unless I asked to change them\n` +
          `- The output MUST be a COMPLETE HTML document ending with </body> and </html>.\n` +
          `- Return the complete updated HTML file starting with <!DOCTYPE html>.`,
      },
    ];

    let accumulated = await streamOnce(effectiveKey, initialMessages, 0.7, onChunk);
    let cleanedCode = stripFences(accumulated);

    // ── Auto-continuation loop ──────────────────────────────────────────────
    let attempts = 0;
    while (!isHtmlComplete(cleanedCode) && attempts < MAX_CONTINUATIONS) {
      attempts++;

      const continuationMessages: Array<{ role: string; content: string }> = [
        { role: 'system', content: EDIT_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Here is the current HTML website:\n\n${currentSourceCode}\n\n---\n\n` +
            `Edit request: ${editPrompt}\n\n` +
            `- Return the complete updated HTML file starting with <!DOCTYPE html>.`,
        },
        { role: 'assistant', content: cleanedCode },
        {
          role: 'user',
          content:
            `Your previous response was cut off before the HTML was complete. ` +
            `Continue EXACTLY from where you stopped. ` +
            `Do NOT repeat any code that was already written — just output the continuation ` +
            `from the last character of your previous response. ` +
            `End properly with </body> and </html>.`,
        },
      ];

      const continuation = await streamOnce(effectiveKey, continuationMessages, 0.4, onChunk);
      cleanedCode = stripFences(cleanedCode + continuation);
    }

    onDone(cleanedCode);
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error occurred');
  }
}

export function extractWebsiteName(prompt: string): string {
  const words = prompt
    .split(/\s+/)
    .filter((w: string) => w.length > 3)
    .slice(0, 4)
    .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  if (words.length === 0) return 'Untitled Website';

  const name = words
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return name.length > 40 ? name.slice(0, 40) + '…' : name;
}
// ─── Surgical Edit ────────────────────────────────────────────────────────────

export interface EditPatch {
  description: string;
  search: string;
  replace: string;
}

export interface SurgicalEditCallbacks {
  onPatch: (patch: EditPatch, updatedCode: string, success: boolean) => void;
  onChunk: (rawChunk: string) => void;
  onDone: (finalCode: string, patchCount: number) => void;
  onError: (err: string) => void;
}

export const SURGICAL_EDIT_SYSTEM_PROMPT = `You are a surgical HTML editor. Your ONLY job is to produce targeted patches for an existing HTML file.

Return ONLY NDJSON — one JSON object per line, no blank lines between them, absolutely no other text.

Each line must be valid JSON with exactly these keys:
{"description":"Short human description of this change","search":"exact_substring_to_find","replace":"replacement_string"}

CRITICAL RULES:
1. Return NOTHING except NDJSON patch lines — no preamble, no markdown, no explanations
2. "search" MUST be verbatim text copied from the HTML (exact whitespace, newlines, indentation)
3. "search" must be unique in the file — include enough surrounding context (minimum 80 chars) to guarantee uniqueness
4. "replace" is the complete replacement for that exact "search" substring
5. Use the minimum number of patches needed — one patch per logical change
6. If adding a new section, use the section BEFORE the insertion point as the search anchor, and include the new content at the end of the replace value
7. Never include entire large blocks unchanged — keep patches targeted (200–800 chars each)
8. Patches are applied in order top-to-bottom`;

/**
 * Fast surgical edit: AI returns NDJSON patches that are applied one-by-one.
 * Falls back to full rewrite if zero patches succeed.
 */
export async function surgicalEditWebsite(
  apiKey: string | undefined,
  currentSourceCode: string,
  editPrompt: string,
  callbacks: SurgicalEditCallbacks
): Promise<void> {
  const { onPatch, onChunk, onDone, onError } = callbacks;

  const effectiveKey = ENV.apiKey ?? apiKey ?? localStorage.getItem('cobasiteai_api_key') ?? '';
  if (!effectiveKey) {
    onError('No API key found. Set VITE_OPENROUTER_API_KEY in your .env or enter it manually.');
    return;
  }

  // Helper: try to apply a patch with exact then fuzzy matching
  function applyPatch(code: string, patch: EditPatch): { code: string; success: boolean } {
    // 1. Exact match
    if (code.includes(patch.search)) {
      return { code: code.replace(patch.search, patch.replace), success: true };
    }
    // 2. Normalise line-endings and retry
    const normalised = patch.search.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (code.includes(normalised)) {
      return { code: code.replace(normalised, patch.replace), success: true };
    }
    // 3. Trim + first-occurrence of a long unique prefix
    const trimmed = patch.search.trim();
    if (trimmed.length >= 40) {
      const idx = code.indexOf(trimmed);
      if (idx !== -1) {
        return {
          code: code.slice(0, idx) + patch.replace + code.slice(idx + trimmed.length),
          success: true,
        };
      }
    }
    return { code, success: false };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CobasiteAI',
      },
      body: JSON.stringify({
        model: ENV.model,
        stream: true,
        max_tokens: 8000,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SURGICAL_EDIT_SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              `HTML file to edit:\n\`\`\`html\n${currentSourceCode}\n\`\`\`\n\n` +
              `Edit instructions: ${editPrompt}\n\n` +
              `Respond with ONLY NDJSON patch lines. ` +
              `Each line: {"description":"...","search":"exact_verbatim_html_substring","replace":"replacement"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body received');

    const decoder = new TextDecoder();
    let sseBuffer = '';
    let lineBuffer = '';   // accumulates partial NDJSON lines
    let currentCode = currentSourceCode;
    let patchCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const sseLines = sseBuffer.split('\n');
      sseBuffer = sseLines.pop() ?? '';

      for (const sseLine of sseLines) {
        const t = sseLine.trim();
        if (!t || t === 'data: [DONE]') continue;
        if (!t.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(t.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (!delta) continue;

          onChunk(delta);
          lineBuffer += delta;

          // Process every complete NDJSON line
          let nlIdx: number;
          while ((nlIdx = lineBuffer.indexOf('\n')) !== -1) {
            const completeLine = lineBuffer.slice(0, nlIdx).trim();
            lineBuffer = lineBuffer.slice(nlIdx + 1);
            if (!completeLine) continue;

            try {
              const patch = JSON.parse(completeLine) as EditPatch;
              if (!patch.description || typeof patch.search !== 'string' || typeof patch.replace !== 'string') continue;

              const result = applyPatch(currentCode, patch);
              if (result.success) {
                currentCode = result.code;
                patchCount++;
              }
              onPatch(patch, currentCode, result.success);
            } catch {
              // Not valid JSON yet (partial line), skip
            }
          }
        } catch {
          // Skip malformed SSE
        }
      }
    }

    // Try any remaining content in lineBuffer
    const remaining = lineBuffer.trim();
    if (remaining) {
      try {
        const patch = JSON.parse(remaining) as EditPatch;
        if (patch.description && typeof patch.search === 'string' && typeof patch.replace === 'string') {
          const result = applyPatch(currentCode, patch);
          if (result.success) {
            currentCode = result.code;
            patchCount++;
          }
          onPatch(patch, currentCode, result.success);
        }
      } catch { /* ignore */ }
    }

    // If zero patches applied, fall back to full rewrite
    if (patchCount === 0) {
      await editWebsite(apiKey, currentSourceCode, editPrompt, {
        onChunk,
        onDone: (code) => onDone(code, 0),
        onError,
      });
      return;
    }

    onDone(currentCode, patchCount);
  } catch (err) {
    // On network / parse error, fall back to full rewrite
    try {
      await editWebsite(apiKey, currentSourceCode, editPrompt, {
        onChunk,
        onDone: (code) => onDone(code, 0),
        onError,
      });
    } catch {
      onError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }
}