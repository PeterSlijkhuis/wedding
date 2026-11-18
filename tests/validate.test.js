import test from "node:test";
import assert from "node:assert/strict";
import { nameKey, validateSite, validateRsvp, parseNames, validatePage, validateGuest, parseCsv, csvGuests, validateInvite, validateSignup } from "../src/validate.js";

const rejects = (fn, pattern) => assert.throws(fn, (err) => err.status === 400 && pattern.test(err.message));

test("nameKey ignores case, accents and extra spaces", () => {
  assert.equal(nameKey("  José   RODRÍGUEZ "), "jose rodriguez");
  assert.equal(nameKey("Петар"), "петар");
});

test("validateSite", () => {
  const ok = validateSite({ names: "A & B", date: "2027-06-12", theme: "garden", meals: " Beef, Fish ,," });
  assert.deepEqual(ok.meals, ["Beef", "Fish"]);
  assert.equal(validateSite({}).theme, "sage");
  assert.equal(validateSite({ accent: "#6b7355" }).accent, "#6b7355");
  assert.equal(validateSite({ countdown: "yes" }).countdown, false); // only a real boolean turns it on
  assert.equal(validateSite({ countdown: true, location: " Skopje ", coverPhoto: "3" }).coverPhoto, 3);
  rejects(() => validateSite({ coverPhoto: -1 }), /Cover photo/);
  rejects(() => validateSite({ accent: "green" }), /Accent/);
  assert.deepEqual(validateSite({ tagline: { en: "Hi", es: " Hola ", nl: "", fr: "x" } }).tagline, { en: "Hi", es: "Hola" });
  assert.deepEqual(validateSite({ tagline: "Old text" }).tagline, { en: "Old text" }); // saved before taglines were per language
  assert.equal(validateSite({ rsvpDeadline: "2026-12-20" }).rsvpDeadline, "2026-12-20");
  rejects(() => validateSite({ rsvpDeadline: "soon" }), /RSVP deadline/);
  rejects(() => validateSite({ date: "12/06/2027" }), /Date/);
  rejects(() => validateSite({ theme: "neon" }), /Theme/);
  rejects(() => validateSite({ palette: "neon" }), /palette/);
  rejects(() => validateSite({ buttons: "round-ish" }), /buttons/);
  rejects(() => validateSite({ bg: "white" }), /Background color/);
  assert.equal(validateSite({ texture: "paper", bg: "#fafafa" }).texture, "paper");
  assert.deepEqual(validateSite({ pagePhotos: { story: 3, faq: 0 } }).pagePhotos, { story: 3 });
  rejects(() => validateSite({ pagePhotos: { secret: 3 } }), /Page photos/);
  assert.deepEqual(validateSite({ photoFocus: { 3: [20, 80] } }).photoFocus, { 3: [20, 80] });
  rejects(() => validateSite({ photoFocus: { 3: [20, 180] } }), /focus/);
  rejects(() => validateSite({ coverShape: "star" }), /shape/);
  assert.equal(validateSite({ theme: "fiesta", font: "lora" }).font, "lora");
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

test("validateGuest", () => {
  assert.deepEqual(validateGuest({ name: " Ana ", email: "Ana@Example.com", attending: false, meal: "Fish" }),
    { name: "Ana", email: "ana@example.com", attending: false, meal: "", dietary: "" });
  assert.equal(validateGuest({ name: "Ana", attending: null }).attending, null);
  rejects(() => validateGuest({ name: "", attending: null }), /name/);
  rejects(() => validateGuest({ name: "Ana", email: "nope", attending: null }), /email/);
  rejects(() => validateGuest({ name: "Ana", attending: "yes" }), /RSVP/);
});

test("parseCsv handles quotes, newlines in quotes and semicolons", () => {
  assert.deepEqual(parseCsv('﻿name,email\r\n"Smith, Jo",jo@x.nl\n"say ""hi""\nthere",\n\n'),
    [["name", "email"], ["Smith, Jo", "jo@x.nl"], ['say "hi"\nthere', ""]]);
  assert.deepEqual(parseCsv("naam;groep\nAna;1"), [["naam", "groep"], ["Ana", "1"]]);
});

test("csvGuests reads name, email and group in any language and order", () => {
  assert.deepEqual(csvGuests("Groep;Naam;E-mail\nA;Ana;ana@x.nl\nA;Marko;\n;Solo;"),
    [{ name: "Ana", email: "ana@x.nl", group: "A" }, { name: "Marko", email: "", group: "A" }, { name: "Solo", email: "", group: "" }]);
  rejects(() => csvGuests("email\nx@y.z"), /column called name/);
  rejects(() => csvGuests("name,email\nAna,bad"), /Row 2/);
});

test("validateInvite", () => {
  const ok = validateInvite({ from: "Ana & Marko <hi@ana.com>", replyTo: "Ana@ana.com", subject: "Save the date", message: "Hi" });
  assert.equal(ok.replyTo, "ana@ana.com");
  assert.equal(ok.button, "Open our website");
  assert.equal(validateInvite({ from: "hi@ana.com", subject: "s", message: "m" }).from, "hi@ana.com");
  rejects(() => validateInvite({ from: "Ana", subject: "s", message: "m" }), /From/);
  rejects(() => validateInvite({ from: "hi@ana.com", subject: "", message: "m" }), /subject/);
});

test("validateSignup", () => {
  assert.deepEqual(validateSignup({ name: "Lena", email: "Lena@X.si", others: "Tom\n\n Baby \n" }), { name: "Lena", email: "lena@x.si", others: ["Tom", "Baby"] });
  rejects(() => validateSignup({ name: "Lena", email: "" }), /name and email/);
  rejects(() => validateSignup({ name: "L", email: "l@x.si", others: Array(11).fill("x").join("\n") }), /At most 10/);
});

test("validateSite keeps only the origin of the website address", () => {
  assert.equal(validateSite({ siteUrl: "weddingdemo.petervaleria.com/home" }).siteUrl, "https://weddingdemo.petervaleria.com");
  assert.equal(validateSite({ siteUrl: "" }).siteUrl, "");
  rejects(() => validateSite({ siteUrl: "http://x.com" }), /Website address/);
});
