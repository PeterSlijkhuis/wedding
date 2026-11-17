import test from "node:test";
import assert from "node:assert/strict";
import { nameKey, validateSite, validateRsvp, parseNames, validatePage } from "../src/validate.js";

const rejects = (fn, pattern) => assert.throws(fn, (err) => err.status === 400 && pattern.test(err.message));

test("nameKey ignores case, accents and extra spaces", () => {
  assert.equal(nameKey("  José   RODRÍGUEZ "), "jose rodriguez");
  assert.equal(nameKey("Петар"), "петар");
});

test("validateSite", () => {
  const ok = validateSite({ names: "A & B", date: "2027-06-12", theme: "garden", meals: " Beef, Fish ,," });
  assert.deepEqual(ok.meals, ["Beef", "Fish"]);
  assert.equal(validateSite({}).theme, "classic");
  assert.deepEqual(validateSite({ tagline: { en: "Hi", es: " Hola ", nl: "", fr: "x" } }).tagline, { en: "Hi", es: "Hola" });
  assert.deepEqual(validateSite({ tagline: "Old text" }).tagline, { en: "Old text" }); // saved before taglines were per language
  assert.equal(validateSite({ rsvpDeadline: "2026-12-20" }).rsvpDeadline, "2026-12-20");
  rejects(() => validateSite({ rsvpDeadline: "soon" }), /RSVP deadline/);
  rejects(() => validateSite({ date: "12/06/2027" }), /Date/);
  rejects(() => validateSite({ theme: "neon" }), /Theme/);
});

test("validatePage", () => {
  assert.equal(validatePage({ slug: "faq", lang: "mk", title: "x", body: "y" }).lang, "mk");
  rejects(() => validatePage({ slug: "admin", lang: "en" }), /page/);
  rejects(() => validatePage({ slug: "faq", lang: "fr" }), /language/);
});

test("parseNames", () => {
  assert.deepEqual(parseNames("Ana\r\n\n Marko "), ["Ana", "Marko"]);
  rejects(() => parseNames("  \n"), /at least one/);
});

test("validateRsvp", () => {
  const meals = ["Beef", "Fish"];
  const ids = [1, 2];
  const ok = validateRsvp({
    guests: [{ id: 1, attending: true, meal: "Fish", dietary: "nuts" }, { id: 2, attending: false, meal: "Beef", dietary: "x" }],
    note: "Congrats",
  }, ids, meals);
  assert.deepEqual(ok.guests[1], { id: 2, attending: false, meal: "", dietary: "" }); // decline clears meal
  rejects(() => validateRsvp({ guests: [{ id: 1, attending: true, meal: "Fish" }] }, ids, meals), /every guest/);
  rejects(() => validateRsvp({ guests: [{ id: 1, attending: true, meal: "Fish" }, { id: 9, attending: false }] }, ids, meals), /Unknown guest/);
  rejects(() => validateRsvp({ guests: [{ id: 1, attending: true, meal: "Fish" }, { id: 1, attending: false }] }, ids, meals), /Unknown guest/);
  rejects(() => validateRsvp({ guests: [{ id: 1, attending: "yes" }, { id: 2, attending: false }] }, ids, meals), /yes or no/);
  rejects(() => validateRsvp({ guests: [{ id: 1, attending: true, meal: "Pizza" }, { id: 2, attending: false }] }, ids, meals), /Pick a meal/);
  // No meal options configured: meal is not required.
  assert.equal(validateRsvp({ guests: [{ id: 1, attending: true }] }, [1], []).guests[0].meal, "");
});

import { validatePhoto } from "../src/validate.js";

test("validatePhoto accepts JPEG only and caps size", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]).buffer;
  assert.doesNotThrow(() => validatePhoto(jpeg));
  rejects(() => validatePhoto(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]).buffer), /JPEG/); // PNG
  rejects(() => validatePhoto(new ArrayBuffer(0)), /JPEG/);
  rejects(() => validatePhoto(new Uint8Array(2_000_001).fill(0xff).buffer), /under/);
});
