// Publishing from the test site to the live site. The code lives on GitHub: the development branch is the test
// site and main is the live site, each deployed by .github/workflows/deploy.yml. Publishing merges development into
// main through the GitHub API, with a token the couple paste once in the admin (stored in D1, never sent back).
import { HttpError, json, body, getSetting, setSetting } from "./util.js";

const GITHUB = "https://api.github.com";
export const BRANCHES = { test: "development", live: "main" };

/** "Owner/name", or a github.com link to the repository. */
export function parseRepo(input) {
  const match = String(input ?? "").trim().match(/^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  if (!match) throw new HttpError(400, "Repository must look like owner/name");
  return `${match[1]}/${match[2]}`;
}

// env.GITHUB_URL only exists in local tests, to point at a fake GitHub.
async function loadGithub(env) {
  return { repo: "", token: "", ...JSON.parse((await getSetting(env, "github")) || "null"), base: env.GITHUB_URL || GITHUB };
}

async function github(gh, path, init = {}) {
  const res = await fetch(`${gh.base}/repos/${gh.repo}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${gh.token}`, accept: "application/vnd.github+json", "user-agent": "wedding-site", "x-github-api-version": "2022-11-28", ...(init.body ? { "content-type": "application/json" } : {}) },
  });
  if (res.status === 401 || res.status === 403) throw new HttpError(502, "GitHub refused the token. Make a new one with access to this repository (Contents: read and write, Actions: read).");
  if (res.status === 404) throw new HttpError(502, "GitHub cannot find the repository or a branch. Check the repository name and that the token can see it.");
  return res;
}

/** The latest deploy of a branch, from the GitHub Actions runs. */
async function lastDeploy(gh, branch) {
  const res = await github(gh, `/actions/workflows/deploy.yml/runs?branch=${branch}&per_page=1`);
  if (!res.ok) return null;
  const run = (await res.json()).workflow_runs?.[0];
  return run ? { status: run.status, conclusion: run.conclusion, at: run.created_at, url: run.html_url } : null;
}

const routes = {
  /** What would be published, and how the last deploys went. */
  async "GET /api/admin/publish"({ env }) {
    const stage = env.SITE_STAGE || "live";
    const gh = await loadGithub(env);
    const base = { stage, repo: gh.repo, connected: Boolean(gh.repo && gh.token) };
    if (!base.connected) return json(base);
    const res = await github(gh, `/compare/${BRANCHES.live}...${BRANCHES.test}`);
    const diff = await res.json();
    const changes = (diff.commits ?? []).slice(-20).reverse().map((c) => ({ message: c.commit.message.split("\n")[0], at: c.commit.author?.date ?? "" }));
    const [test, live] = await Promise.all([lastDeploy(gh, BRANCHES.test), lastDeploy(gh, BRANCHES.live)]);
    return json({ ...base, waiting: diff.ahead_by ?? 0, changes, deploys: { test, live } });
  },

  async "POST /api/admin/publish/connect"({ request, env }) {
    const input = await body(request);
    const old = await loadGithub(env);
    const gh = { ...old, repo: parseRepo(input.repo), token: String(input.token ?? "").trim() || old.token };
    if (!/^[\w-]{20,255}$/.test(gh.token)) throw new HttpError(400, "Paste the GitHub token (it starts with github_pat_)");
    await github(gh, ""); // fails with a clear message when the token or name is wrong
    await setSetting(env, "github", JSON.stringify({ repo: gh.repo, token: gh.token }));
    return json({ ok: true });
  },

  async "POST /api/admin/publish"({ env }) {
    if (env.SITE_STAGE !== "test") throw new HttpError(400, "Publish from the test site");
    const gh = await loadGithub(env);
    if (!gh.token) throw new HttpError(400, "Connect GitHub first");
    const res = await github(gh, "/merges", { method: "POST", body: JSON.stringify({ base: BRANCHES.live, head: BRANCHES.test, commit_message: "Publish to the live site" }) });
    if (res.status === 204) return json({ published: false });
    if (res.status === 409) throw new HttpError(409, "The live site has changes the test site does not. Ask your developer to bring them together first.");
    if (!res.ok) throw new HttpError(502, `GitHub could not publish (${res.status})`);
    return json({ published: true });
  },
};

export async function publishApi(key, { role, ...ctx }) {
  if (!routes[key]) return undefined;
  if (role !== "admin") return json({ error: "Admin login required" }, role ? 403 : 401);
  return routes[key](ctx);
}
