import test from "node:test";
import assert from "node:assert/strict";
import { PALETTES, FONTS, LAYOUTS, ARTS, TEMPLATES, MOODS, resolveDesign } from "../public/js/designs.js";

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

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

test("templates only use known parts", () => {
  for (const [id, t] of Object.entries(TEMPLATES)) {
    assert.ok(PALETTES[t.palette] && FONTS[t.font] && LAYOUTS[t.layout] && ARTS[t.art] && MOODS.includes(t.mood), id);
  }
  for (const mood of MOODS) assert.ok(Object.values(TEMPLATES).filter((t) => t.mood === mood).length >= 3, mood);
});

test("saved choices win over the template, unknown ones fall back", () => {
  assert.deepEqual(resolveDesign({ theme: "garden" }), { palette: "garden", font: "lora", layout: "centered", art: "botanical" });
  assert.equal(resolveDesign({ theme: "garden", palette: "midnight" }).palette, "midnight");
  assert.equal(resolveDesign({ theme: "nope", font: "nope" }).font, "garamond");
});
