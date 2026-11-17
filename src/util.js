// Small helpers shared by the worker and the API handlers.

/** An error whose message is safe to show to the caller. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });

/** Parse the JSON request body, or fail with a 400. */
export async function body(request) {
  try {
    return await request.json();
  } catch (err) {
    throw new HttpError(400, `Invalid JSON body: ${err.message}`);
  }
}

export async function getSetting(env, key) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row?.value ?? null;
}

export async function setSetting(env, key, value) {
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, value).run();
}
