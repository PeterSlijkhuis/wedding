// Design system: a template is a preset of four independent choices (palette, fonts, layout, art),
// like Joy's Color / Font / Layout / Art. The couple pick a template, then change any of the four.
// Used by the browser (applyDesign) and by the worker (validation), so this is the only list.

/** Colors. text, muted and accent must stay readable on bg (checked in tests/designs.test.js). */
export const PALETTES = {
  sage: { name: "Sage", bg: "#ffffff", card: "#fafaf8", text: "#3f4632", muted: "#666d52", accent: "#5f6849", accent2: "#a9bd93", onAccent: "#ffffff" },
  classic: { name: "Linen", bg: "#fbf8f4", card: "#ffffff", text: "#2b2622", muted: "#6e645c", accent: "#8a5a3e", accent2: "#d9b99b", onAccent: "#ffffff" },
  modern: { name: "Pine", bg: "#ffffff", card: "#f5f7f6", text: "#141414", muted: "#5c5c5c", accent: "#2f6b57", accent2: "#9cc4b5", onAccent: "#ffffff" },
  garden: { name: "Meadow", bg: "#f3f7ef", card: "#ffffff", text: "#26331f", muted: "#55684a", accent: "#496d32", accent2: "#a7c98c", onAccent: "#ffffff" },
  ivory: { name: "Ivory & Gold", bg: "#fbf8f1", card: "#ffffff", text: "#2e2a24", muted: "#6b6255", accent: "#80622a", accent2: "#d8bf86", onAccent: "#ffffff" },
  merlot: { name: "Merlot", bg: "#faf5f3", card: "#ffffff", text: "#3a1d24", muted: "#74525c", accent: "#7d2340", accent2: "#d9a3b2", onAccent: "#ffffff" },
  blush: { name: "Blush", bg: "#fdf4f2", card: "#ffffff", text: "#4a2e33", muted: "#80595f", accent: "#a8406a", accent2: "#f0b7c4", onAccent: "#ffffff" },
  lavender: { name: "Lavender", bg: "#f7f4fb", card: "#ffffff", text: "#352c45", muted: "#675c7d", accent: "#6a4d9e", accent2: "#c7b6e6", onAccent: "#ffffff" },
  coastal: { name: "Coastal", bg: "#f2f6f8", card: "#ffffff", text: "#1f3340", muted: "#536978", accent: "#27627f", accent2: "#a6cadb", onAccent: "#ffffff" },
  terracotta: { name: "Terracotta", bg: "#f8efe6", card: "#fffaf5", text: "#3b2a20", muted: "#735645", accent: "#9e4722", accent2: "#e2a07a", onAccent: "#ffffff" },
  olive: { name: "Olive Grove", bg: "#f3f2e7", card: "#fbfaf3", text: "#2f3320", muted: "#5f6346", accent: "#56632a", accent2: "#b8bf8a", onAccent: "#ffffff" },
  desert: { name: "Desert Sand", bg: "#f5ece0", card: "#fcf7f0", text: "#3d2e22", muted: "#735d48", accent: "#8f5228", accent2: "#dcb48d", onAccent: "#ffffff" },
  marigold: { name: "Marigold", bg: "#fff8e8", card: "#ffffff", text: "#2b2118", muted: "#6a5640", accent: "#b04a12", accent2: "#f2b43c", onAccent: "#ffffff" },
  fiesta: { name: "Fiesta", bg: "#fff6ef", card: "#ffffff", text: "#2a1a2e", muted: "#66506b", accent: "#b52a5d", accent2: "#f29a3a", onAccent: "#ffffff" },
  mono: { name: "Monochrome", bg: "#ffffff", card: "#f4f4f4", text: "#111111", muted: "#575757", accent: "#111111", accent2: "#c9c9c9", onAccent: "#ffffff" },
  midnight: { name: "Midnight", bg: "#141a26", card: "#1c2433", text: "#f2efe8", muted: "#aab1c0", accent: "#e3b65b", accent2: "#8a7444", onAccent: "#141a26", dark: true },
  emerald: { name: "Emerald Velvet", bg: "#0f2a22", card: "#163a2f", text: "#f3efe4", muted: "#b2c2b7", accent: "#d9b26a", accent2: "#5f8f78", onAccent: "#0f2a22", dark: true },
};

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Font pairings: display is the couple's names, heading the page titles, body the text. */
export const FONTS = {
  garamond: { name: "Garamond", display: `"EB Garamond", ${SERIF}`, heading: `"EB Garamond", ${SERIF}`, body: `Inter, ${SANS}` },
  cormorant: { name: "Cormorant", display: `"Cormorant Garamond", ${SERIF}`, heading: `"Cormorant Garamond", ${SERIF}`, body: `Montserrat, ${SANS}`, weight: 500 },
  script: { name: "Romantic script", display: `"Great Vibes", cursive`, heading: `"Cormorant Garamond", ${SERIF}`, body: `Montserrat, ${SANS}`, scale: 1.25 },
  prata: { name: "Prata", display: `Prata, ${SERIF}`, heading: `Prata, ${SERIF}`, body: `Raleway, ${SANS}` },
  yeseva: { name: "Yeseva", display: `"Yeseva One", ${SERIF}`, heading: `"Yeseva One", ${SERIF}`, body: `Raleway, ${SANS}` },
  forum: { name: "Forum", display: `Forum, ${SERIF}`, heading: `Forum, ${SERIF}`, body: `Jost, ${SANS}`, caps: true },
  jost: { name: "Jost", display: `Jost, ${SANS}`, heading: `Jost, ${SANS}`, body: `Jost, ${SANS}`, caps: true, weight: 400 },
  oswald: { name: "Oswald", display: `Oswald, ${SANS}`, heading: `Oswald, ${SANS}`, body: `Inter, ${SANS}`, caps: true, weight: 500 },
  lora: { name: "Lora", display: `Lora, ${SERIF}`, heading: `Lora, ${SERIF}`, body: `Nunito, ${SANS}` },
  unbounded: { name: "Unbounded", display: `Unbounded, ${SANS}`, heading: `Unbounded, ${SANS}`, body: `Manrope, ${SANS}`, weight: 600, scale: 0.85 },
  caveat: { name: "Handwritten", display: `Caveat, cursive`, heading: `Alice, ${SERIF}`, body: `Nunito, ${SANS}`, scale: 1.2 },
  system: { name: "System (fastest)", display: SERIF, heading: SERIF, body: SANS },
};

/** Page layouts. Only CSS changes (see [data-layout] in site.css). */
export const LAYOUTS = {
  centered: "Centered",
  framed: "Framed card",
  split: "Split",
  bold: "Bold banner",
};

/** Decorations, painted in the palette's second color. Each names its pictures in /img/art/:
 *  ornament: above the names (ratio = width / height), sides: tall branches beside the page on wide screens,
 *  scatter: a pattern over the landing background, panel: the big picture in the split layout.
 *  css: drawn by CSS only (see [data-art] in site.css). To add one: draw an SVG, add a line here. */
export const ARTS = {
  none: { name: "None" },
  sprig: { name: "Sprig", ornament: "sprig.svg", ratio: 2.6 },
  botanical: { name: "Botanical sides", ornament: "sprig.svg", ratio: 2.6, sides: "botanical.svg" },
  wildflowers: { name: "Wildflowers", ornament: "wildflowers.svg", ratio: 2.6, sides: "wildflowers-side.svg" },
  olive: { name: "Olive branch", ornament: "olive.svg", ratio: 2.6, sides: "olive-side.svg" },
  stars: { name: "Starry sky", ornament: "sparkle.svg", ratio: 2.6, scatter: "stars.svg" },
  sun: { name: "Sun", ornament: "sun.svg", ratio: 1, panel: "sun.svg" },
  arch: { name: "Arch", css: true },
  deco: { name: "Art deco lines", css: true },
  confetti: { name: "Confetti", css: true },
};

/** How much moves: still (only hover feedback), gentle (the names arrive once, photos settle), lively (also the
 *  decoration draws in and the cover photo develops). Always off for people who ask for reduced motion. */
export const MOTIONS = { still: "Still", gentle: "Gentle", lively: "Lively" };

export const MOODS = ["elegant", "bold", "charming", "earthy", "expressive"];

/** Templates. The four oldest ids (sage, classic, modern, garden) stay for sites saved before templates. */
export const TEMPLATES = {
  sage: { name: "Sage", mood: "elegant", palette: "sage", font: "garamond", layout: "centered", art: "sprig", motion: "gentle" },
  ivory: { name: "Ivory Vows", mood: "elegant", palette: "ivory", font: "cormorant", layout: "framed", art: "deco", motion: "gentle" },
  merlot: { name: "Merlot Evening", mood: "elegant", palette: "merlot", font: "prata", layout: "centered", art: "deco", motion: "gentle" },
  lavender: { name: "Lavender Letter", mood: "elegant", palette: "lavender", font: "script", layout: "framed", art: "sprig", motion: "gentle" },
  classic: { name: "Classic", mood: "elegant", palette: "classic", font: "garamond", layout: "framed", art: "none", motion: "still" },
  starry: { name: "Starry Night", mood: "elegant", palette: "midnight", font: "script", layout: "centered", art: "stars", motion: "lively" },
  midnight: { name: "Midnight Gala", mood: "bold", palette: "midnight", font: "yeseva", layout: "bold", art: "deco", motion: "gentle" },
  emerald: { name: "Emerald Velvet", mood: "bold", palette: "emerald", font: "forum", layout: "framed", art: "deco", motion: "gentle" },
  modern: { name: "Modern", mood: "bold", palette: "modern", font: "jost", layout: "split", art: "none", motion: "gentle" },
  statement: { name: "Statement", mood: "bold", palette: "mono", font: "oswald", layout: "bold", art: "none", motion: "lively" },
  blush: { name: "Blush Garden", mood: "charming", palette: "blush", font: "script", layout: "centered", art: "botanical", motion: "lively" },
  picnic: { name: "Picnic", mood: "charming", palette: "marigold", font: "caveat", layout: "centered", art: "confetti", motion: "lively" },
  seaside: { name: "Seaside", mood: "charming", palette: "coastal", font: "caveat", layout: "split", art: "sun", motion: "gentle" },
  meadow: { name: "Meadow", mood: "charming", palette: "garden", font: "caveat", layout: "centered", art: "wildflowers", motion: "lively" },
  garden: { name: "Garden", mood: "earthy", palette: "garden", font: "lora", layout: "centered", art: "botanical", motion: "gentle" },
  terracotta: { name: "Terracotta", mood: "earthy", palette: "terracotta", font: "lora", layout: "split", art: "sun", motion: "gentle" },
  olive: { name: "Olive Grove", mood: "earthy", palette: "olive", font: "garamond", layout: "framed", art: "olive", motion: "gentle" },
  desert: { name: "Desert Bloom", mood: "earthy", palette: "desert", font: "prata", layout: "split", art: "arch", motion: "gentle" },
  tuscan: { name: "Tuscan Table", mood: "earthy", palette: "terracotta", font: "cormorant", layout: "centered", art: "olive", motion: "lively" },
  fiesta: { name: "Fiesta", mood: "expressive", palette: "fiesta", font: "unbounded", layout: "bold", art: "confetti", motion: "lively" },
  marigold: { name: "Marigold", mood: "expressive", palette: "marigold", font: "yeseva", layout: "split", art: "sun", motion: "lively" },
  disco: { name: "Disco", mood: "expressive", palette: "lavender", font: "unbounded", layout: "bold", art: "stars", motion: "lively" },
  arches: { name: "Golden Arch", mood: "expressive", palette: "ivory", font: "forum", layout: "centered", art: "arch", motion: "lively" },
};

/** The four choices in effect: saved values, else the template's preset. */
export function resolveDesign(site) {
  const preset = TEMPLATES[site.theme] ?? TEMPLATES.sage;
  const pick = (key, list) => (list[site[key]] ? site[key] : preset[key]);
  return { palette: pick("palette", PALETTES), font: pick("font", FONTS), layout: pick("layout", LAYOUTS), art: pick("art", ARTS), motion: pick("motion", MOTIONS) };
}

/** Apply a design to a document: CSS variables for colors and fonts, data attributes for layout and art. */
export function applyDesign(doc, site) {
  const design = resolveDesign(site);
  const p = PALETTES[design.palette];
  const f = FONTS[design.font];
  const art = ARTS[design.art];
  const pic = (file) => (file ? `url("/img/art/${file}")` : "none");
  const root = doc.documentElement;
  const vars = {
    "--bg": p.bg, "--card": p.card, "--text": p.text, "--muted": p.muted,
    "--accent": site.accent || p.accent, "--accent-2": p.accent2, "--on-accent": p.onAccent,
    "--font": f.body, "--font-heading": f.heading, "--font-display": f.display,
    "--heading-weight": String(f.weight ?? 400), "--heading-case": f.caps ? "uppercase" : "none",
    "--heading-tracking": f.caps ? "0.08em" : "0", "--display-scale": String(f.scale ?? 1),
    "--art-ornament": pic(art.ornament), "--art-ratio": String(art.ratio ?? 1), "--art-sides": pic(art.sides),
    "--art-scatter": pic(art.scatter), "--art-panel": pic(art.panel ?? art.ornament ?? "sun.svg"),
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.dataset.theme = site.theme;
  root.dataset.layout = design.layout;
  root.dataset.art = design.art;
  root.dataset.tone = p.dark ? "dark" : "light";
  root.dataset.movement = design.motion;
  root.dataset.coverShape = site.coverShape || "rounded";
  for (const part of ["ornament", "sides", "scatter"]) {
    if (art[part]) root.dataset[part] = ""; else delete root.dataset[part];
  }
  return design;
}
