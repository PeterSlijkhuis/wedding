import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PALETTES, FONTS, LAYOUTS, ARTS, MOTIONS, TEMPLATES, MOODS, STYLES, resolveDesign, contrast, colors } from "../public/js/designs.js";

test("every palette is readable (WCAG AA 4.5:1)", () => {
  for (const [id, p] of Object.entries(PALETTES)) {
    for (const surface of ["bg", "card"]) {
      for (const ink of ["text", "muted", "accent"]) {
        assert.ok(contrast(p[ink], p[surface]) >= 4.5, `${id}: ${ink} on ${surface} is ${contrast(p[ink], p[surface]).toFixed(2)}`);
      }
    }
    assert.ok(contrast(p.onAccent, p.accent) >= 4.5, `${id}: button text on accent is ${contrast(p.onAccent, p.accent).toFixed(2)}`);
  }
});

// Same mix as --tint in site.css: color-mix(in srgb, accent-2 22%, bg). The landing hero and framed layout sit on it.
const mix = (a, b, w) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * w + parseInt(b.slice(i, i + 2), 16) * (1 - w)).toString(16).padStart(2, "0")).join("");

test("text stays readable on the tinted background", () => {
  for (const [id, p] of Object.entries(PALETTES)) {
    const tint = mix(p.accent2, p.bg, 0.22);
    for (const ink of ["text", "muted", "accent"]) {
      assert.ok(contrast(p[ink], tint) >= 4.5, `${id}: ${ink} on tint is ${contrast(p[ink], tint).toFixed(2)}`);
    }
  }
});

test("templates only use known parts", () => {
  for (const [id, t] of Object.entries(TEMPLATES)) {
    assert.ok(PALETTES[t.palette] && FONTS[t.font] && LAYOUTS[t.layout] && ARTS[t.art] && MOTIONS[t.motion] && MOODS.includes(t.mood), id);
    for (const key of Object.keys(STYLES)) assert.ok(t[key] === undefined || STYLES[key].includes(t[key]), `${id}: ${key}`);
  }
  for (const mood of MOODS) assert.ok(Object.values(TEMPLATES).filter((t) => t.mood === mood).length >= 3, mood);
});

test("saved choices win over the template, unknown ones fall back", () => {
  assert.deepEqual(resolveDesign({ theme: "garden" }), {
    palette: "garden", font: "lora", layout: "centered", art: "eucalyptus", motion: "gentle",
    buttons: "pill", cards: "round", texture: "linen", textSize: "m", artSize: "m",
  });
  assert.equal(resolveDesign({ theme: "garden", art: "sprig" }).art, "eucalyptus", "decorations saved before the redraw still show");
  assert.equal(resolveDesign({ theme: "garden", buttons: "square", texture: "nope" }).buttons, "square");
  assert.equal(resolveDesign({ theme: "garden", texture: "nope" }).texture, "linen");
  assert.equal(resolveDesign({ theme: "garden", palette: "midnight" }).palette, "midnight");
  assert.equal(resolveDesign({ theme: "nope", font: "nope" }).font, "garamond");
});

test("every decoration's pictures exist and only use the palette tones", () => {
  for (const [id, art] of Object.entries(ARTS)) {
    if (!art.svg) continue;
    for (const file of [`${art.svg}.svg`, `${art.svg}-corner.svg`]) {
      const url = new URL(`../public/img/art/${file}`, import.meta.url);
      assert.ok(existsSync(url), `${id}: ${file}`);
      assert.ok(!/#[0-9a-f]{3,6}\b/i.test(readFileSync(url, "utf8")), `${file} has a fixed color`);
    }
  }
});

test("own colors are used only when they are real colors", () => {
  assert.equal(colors({ bg: "#123456" }, "sage").bg, "#123456");
  assert.equal(colors({ bg: "red" }, "sage").bg, PALETTES.sage.bg);
  assert.equal(colors({ accent2: "#abcdef" }, "sage").accent2, "#abcdef");
});
