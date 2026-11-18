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
  champagne: { name: "Champagne", bg: "#faf6ef", card: "#ffffff", text: "#332b22", muted: "#6c5f50", accent: "#7a5c3a", accent2: "#e3cfae", onAccent: "#ffffff" },
  amalfi: { name: "Amalfi", bg: "#f6f8fb", card: "#ffffff", text: "#1b2a44", muted: "#4f5d75", accent: "#1f4e8c", accent2: "#f1cf4b", onAccent: "#ffffff" },
  dustyrose: { name: "Dusty Rose", bg: "#f8f1ee", card: "#fffbf9", text: "#3d2c2b", muted: "#735a57", accent: "#8c4f4f", accent2: "#d9b0a7", onAccent: "#ffffff" },
  slate: { name: "Dusty Blue", bg: "#f3f5f7", card: "#ffffff", text: "#24303b", muted: "#55626f", accent: "#3e5a73", accent2: "#a9bccd", onAccent: "#ffffff" },
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

/** Decorations: original artwork in /img/art/, drawn in three tones of the palette (see make_art.py).
 *  svg: the set name, giving <set>.svg (the ornament above the names) and <set>-corner.svg (the page corners).
 *  css: drawn by CSS only (see [data-art] in site.css). To add one: draw it in scripts/make_art.py, add a line here. */
export const ARTS = {
  none: { name: "None" },
  eucalyptus: { name: "Eucalyptus", svg: "eucalyptus" },
  roses: { name: "Roses", svg: "roses" },
  wildflowers: { name: "Wildflowers", svg: "wildflowers" },
  olive: { name: "Olive branch", svg: "olive" },
  laurel: { name: "Laurel", svg: "laurel" },
  citrus: { name: "Lemon grove", svg: "citrus" },
  tropical: { name: "Palm leaves", svg: "tropical" },
  pampas: { name: "Pampas grass", svg: "pampas" },
  celestial: { name: "Moon and stars", svg: "celestial" },
  sun: { name: "Sun", svg: "sun" },
  deco: { name: "Art deco", svg: "deco" },
  arch: { name: "Arch", css: true },
  confetti: { name: "Confetti", css: true },
};
/** Decorations saved before the artwork was redrawn. */
const OLD_ARTS = { sprig: "eucalyptus", botanical: "eucalyptus", stars: "celestial" };

/** Finishing touches. The first value of each is the default; a template may preset any of them. */
export const STYLES = {
  buttons: ["pill", "rounded", "square", "outline"],
  cards: ["round", "soft", "sharp"],
  texture: ["plain", "paper", "linen", "dots", "glow"],
  textSize: ["m", "s", "l"],
  artSize: ["m", "s", "l"],
};

/** How much moves: still (only hover feedback), gentle (the names arrive once, photos settle), lively (also the
 *  decoration draws in and the cover photo develops). Always off for people who ask for reduced motion. */
export const MOTIONS = { still: "Still", gentle: "Gentle", lively: "Lively" };

export const MOODS = ["elegant", "bold", "charming", "earthy", "expressive"];

/** Templates. The four oldest ids (sage, classic, modern, garden) stay for sites saved before templates. */
export const TEMPLATES = {
  sage: { name: "Sage", mood: "elegant", palette: "sage", font: "garamond", layout: "centered", art: "eucalyptus", motion: "gentle" },
  ivory: { name: "Ivory Vows", mood: "elegant", palette: "ivory", font: "cormorant", layout: "framed", art: "deco", motion: "gentle", buttons: "outline", cards: "sharp", texture: "paper" },
  merlot: { name: "Merlot Evening", mood: "elegant", palette: "merlot", font: "prata", layout: "centered", art: "roses", motion: "gentle", texture: "paper" },
  lavender: { name: "Lavender Letter", mood: "elegant", palette: "lavender", font: "script", layout: "framed", art: "laurel", motion: "gentle", cards: "soft", buttons: "rounded" },
  classic: { name: "Classic", mood: "elegant", palette: "classic", font: "garamond", layout: "framed", art: "none", motion: "still", buttons: "rounded", texture: "paper", cards: "soft" },
  starry: { name: "Starry Night", mood: "elegant", palette: "midnight", font: "script", layout: "centered", art: "celestial", motion: "lively", texture: "glow" },
  champagne: { name: "Champagne", mood: "elegant", palette: "champagne", font: "cormorant", layout: "centered", art: "laurel", motion: "gentle", buttons: "outline", texture: "linen" },
  midnight: { name: "Midnight Gala", mood: "bold", palette: "midnight", font: "yeseva", layout: "bold", art: "deco", motion: "gentle", buttons: "square", texture: "glow", cards: "sharp" },
  emerald: { name: "Emerald Velvet", mood: "bold", palette: "emerald", font: "forum", layout: "framed", art: "tropical", motion: "gentle", buttons: "outline", texture: "glow", cards: "sharp" },
  modern: { name: "Modern", mood: "bold", palette: "modern", font: "jost", layout: "split", art: "none", motion: "gentle", buttons: "square", cards: "sharp" },
  statement: { name: "Statement", mood: "bold", palette: "mono", font: "oswald", layout: "bold", art: "none", motion: "lively", buttons: "square", cards: "sharp", textSize: "l" },
  blush: { name: "Blush Garden", mood: "charming", palette: "blush", font: "script", layout: "centered", art: "roses", motion: "lively" },
  picnic: { name: "Picnic", mood: "charming", palette: "marigold", font: "caveat", layout: "centered", art: "citrus", motion: "lively", texture: "dots" },
  seaside: { name: "Seaside", mood: "charming", palette: "coastal", font: "caveat", layout: "split", art: "sun", motion: "gentle", texture: "linen", buttons: "rounded", cards: "soft" },
  meadow: { name: "Meadow", mood: "charming", palette: "garden", font: "caveat", layout: "centered", art: "wildflowers", motion: "lively" },
  amalfi: { name: "Amalfi", mood: "charming", palette: "amalfi", font: "prata", layout: "framed", art: "citrus", motion: "gentle", buttons: "rounded", texture: "paper", cards: "soft" },
  garden: { name: "Garden", mood: "earthy", palette: "garden", font: "lora", layout: "centered", art: "eucalyptus", motion: "gentle", texture: "linen" },
  terracotta: { name: "Terracotta", mood: "earthy", palette: "terracotta", font: "lora", layout: "split", art: "sun", motion: "gentle", texture: "paper", buttons: "rounded", cards: "soft" },
  olive: { name: "Olive Grove", mood: "earthy", palette: "olive", font: "garamond", layout: "framed", art: "olive", motion: "gentle", texture: "linen", buttons: "rounded", cards: "soft" },
  desert: { name: "Desert Bloom", mood: "earthy", palette: "desert", font: "prata", layout: "split", art: "pampas", motion: "gentle", cards: "soft", texture: "paper", buttons: "rounded" },
  tuscan: { name: "Tuscan Table", mood: "earthy", palette: "terracotta", font: "cormorant", layout: "centered", art: "olive", motion: "lively", texture: "linen" },
  boho: { name: "Boho", mood: "earthy", palette: "dustyrose", font: "caveat", layout: "centered", art: "pampas", motion: "lively", cards: "soft", texture: "paper" },
  fiesta: { name: "Fiesta", mood: "expressive", palette: "fiesta", font: "unbounded", layout: "bold", art: "confetti", motion: "lively", buttons: "rounded", cards: "soft" },
  marigold: { name: "Marigold", mood: "expressive", palette: "marigold", font: "yeseva", layout: "split", art: "sun", motion: "lively", texture: "dots", buttons: "rounded", cards: "soft" },
  disco: { name: "Disco", mood: "expressive", palette: "lavender", font: "unbounded", layout: "bold", art: "celestial", motion: "lively", texture: "glow", buttons: "square", cards: "soft" },
  arches: { name: "Golden Arch", mood: "expressive", palette: "ivory", font: "forum", layout: "centered", art: "arch", motion: "lively", buttons: "outline" },
  jungle: { name: "Jungle", mood: "expressive", palette: "emerald", font: "yeseva", layout: "centered", art: "tropical", motion: "lively", buttons: "rounded", textSize: "l" },
};

/** The choices in effect: saved values, else the template's preset, else the first style. */
export function resolveDesign(site) {
  const preset = TEMPLATES[site.theme] ?? TEMPLATES.sage;
  const pick = (key, list) => (list[site[key]] ? site[key] : preset[key]);
  const art = OLD_ARTS[site.art] ?? site.art;
  const style = (key) => (STYLES[key].includes(site[key]) ? site[key] : preset[key] ?? STYLES[key][0]);
  return {
    palette: pick("palette", PALETTES), font: pick("font", FONTS), layout: pick("layout", LAYOUTS),
    art: ARTS[art] ? art : OLD_ARTS[preset.art] ?? preset.art, motion: pick("motion", MOTIONS),
    ...Object.fromEntries(Object.keys(STYLES).map((key) => [key, style(key)])),
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
/** WCAG contrast ratio of two #rrggbb colors (1 to 21). */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** The palette with the couple's own colors (accent, background, second color) laid over it. */
export function colors(site, palette) {
  const p = PALETTES[palette];
  const own = (key) => (HEX.test(site[key] ?? "") ? site[key] : "");
  const bg = own("bg");
  return { ...p, accent: own("accent") || p.accent, accent2: own("accent2") || p.accent2, bg: bg || p.bg, card: bg ? `color-mix(in srgb, ${bg} 70%, ${p.card})` : p.card };
}

const artFiles = new Map();
/** The text of one artwork file, fetched once per page. */
export function artSvg(file) {
  if (!artFiles.has(file)) artFiles.set(file, fetch(`/img/art/${file}`).then((r) => (r.ok ? r.text() : "")).catch(() => ""));
  return artFiles.get(file);
}

/** Put the artwork into a document: the ornaments, the two page corners and the split layout's panel. */
async function paintArt(doc, name) {
  const art = ARTS[name];
  const root = doc.documentElement;
  root.dataset.painting = name;
  const [ornament, corner] = art.svg ? await Promise.all([artSvg(`${art.svg}.svg`), artSvg(`${art.svg}-corner.svg`)]) : ["", ""];
  if (root.dataset.painting !== name) return; // a newer choice came in while this one loaded
  for (const box of doc.querySelectorAll(".ornament")) box.innerHTML = ornament;
  for (const box of [doc.body, ...doc.querySelectorAll(".art-panel")]) {
    if (!box) continue;
    for (const old of box.querySelectorAll(":scope > .art-corner")) old.remove();
    if (!corner) continue;
    for (const where of ["tl", "br"]) {
      const div = doc.createElement("div");
      div.className = `art-corner ${where}`;
      div.setAttribute("aria-hidden", "true");
      div.innerHTML = corner;
      box.prepend(div);
    }
  }
}

/** Apply a design to a document: CSS variables for colors and fonts, data attributes for the rest. */
export function applyDesign(doc, site) {
  const design = resolveDesign(site);
  const p = colors(site, design.palette);
  const f = FONTS[design.font];
  const root = doc.documentElement;
  const vars = {
    "--bg": p.bg, "--card": p.card, "--text": p.text, "--muted": p.muted,
    "--accent": p.accent, "--accent-2": p.accent2, "--on-accent": p.onAccent,
    "--font": f.body, "--font-heading": f.heading, "--font-display": f.display,
    "--heading-weight": String(f.weight ?? 400), "--heading-case": f.caps ? "uppercase" : "none",
    "--heading-tracking": f.caps ? "0.08em" : "0", "--display-scale": String(f.scale ?? 1),
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.dataset.theme = site.theme;
  root.dataset.layout = design.layout;
  root.dataset.art = design.art;
  root.dataset.tone = PALETTES[design.palette].dark ? "dark" : "light";
  root.dataset.movement = design.motion;
  root.dataset.coverShape = site.coverShape || "rounded";
  for (const key of Object.keys(STYLES)) root.dataset[key] = design[key];
  if (ARTS[design.art].svg) root.dataset.ornament = ""; else delete root.dataset.ornament;
  paintArt(doc, design.art);
  return design;
}
