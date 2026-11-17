// Shared page helpers: translations and JSON API calls.

export const LANGUAGES = { en: "English", es: "Español", nl: "Nederlands", mk: "Македонски" };
let strings = {};

function pickLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (err) { console.warn("localStorage unavailable", err); }
  const browser = (navigator.language || "en").slice(0, 2);
  return [fromUrl, saved, browser].find((l) => l in LANGUAGES) || "en";
}

/** Text for a key in the current language, falling back to the key itself. */
export const t = (key) => strings[key] ?? key;

export async function initI18n() {
  const lang = pickLanguage();
  const res = await fetch(`/i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Missing translation file /i18n/${lang}.json`);
  strings = await res.json();
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });

  const select = document.querySelector("select.lang");
  if (select) {
    select.innerHTML = Object.entries(LANGUAGES).map(([code, name]) => `<option value="${code}">${name}</option>`).join("");
    select.value = lang;
    select.onchange = () => {
      try { localStorage.setItem("lang", select.value); } catch (err) { console.warn("localStorage unavailable", err); }
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      location.href = url;
    };
  }
}

/** POST JSON and return the parsed body; throws Error with the server's message on failure. */
export async function post(path, body = {}) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function logout() {
  await post("/api/logout");
  location.href = "/login";
}
