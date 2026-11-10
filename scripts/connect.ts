// Connects a real account to a package deployed on the local test server, checks the
// account's health, and lists the tools it exposes. The secret comes from an environment
// variable and is never printed.
// Usage: node scripts/connect.ts <app title> <requirement> <method> <field>=<ENV_VAR>...
const [title, requirement, method, ...bindings] = process.argv.slice(2);
if (!title || !requirement || !method || bindings.length === 0)
  throw new Error("Usage: connect.ts <app title> <requirement> <method> <field>=<ENV_VAR>...");
const host = process.env.EXECUTOR_HOST ?? "http://127.0.0.1:4399";
const headers = { Authorization: `Bearer ${process.env.EXECUTOR_API_KEY}`, "content-type": "application/json" };
const api = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(`${host}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : null;
};
const fields = Object.fromEntries(
  bindings.map((binding) => {
    const [field, variable] = binding.split("=");
    const value = process.env[variable!];
    if (!value) throw new Error(`${variable} is not set`);
    return [field, value];
  }),
);

const apps = await api("GET", "/v1/apps");
const app = (Array.isArray(apps) ? apps : apps.items).find((item: { name: string }) => item.name === title);
if (!app) throw new Error(`No app named ${title}`);
const profiles = await api("GET", `/v1/apps/${app.id}/profiles`);
const profile =
  (Array.isArray(profiles) ? profiles : profiles.items)[0] ??
  (await api("POST", `/v1/apps/${app.id}/profiles`, {
    owner: "local",
    subject: "local",
    accounts: {},
    idempotencyKey: `test-${app.id}`,
  }));
const link = await api("POST", "/account-connect/api/requests", {
  owner: "local",
  target: { app: app.id, profile: profile.id, requirement },
});
const fragment = new URLSearchParams(new URL(link.url).hash.slice(1));
const grant = { connection: link.connection, token: fragment.get("token") ?? fragment.get("t") };
if (!grant.token) throw new Error(`Link fragment has keys ${[...fragment.keys()].join(", ")}`);
const account = await api("POST", "/account-connect/api/submit", { ...grant, method, fields });
const health = await api("POST", `/v1/accounts/${account.id}/health`, {});
console.log(`${title}: account ${account.id} health ${JSON.stringify(health).slice(0, 400)}`);
let count = 0;
let sample: string[] = [];
let cursor: string | undefined;
do {
  const page = await api(
    "GET",
    `/v1/tools?app=${app.id}&profile=${profile.id}&limit=500${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
  count += page.items.length;
  if (sample.length === 0) sample = page.items.slice(0, 5).map((tool: { name: string }) => tool.name);
  cursor = page.next ?? undefined;
} while (cursor);
console.log(`${title}: ${count} tools listed with the account, e.g. ${sample.join(", ")}`);
