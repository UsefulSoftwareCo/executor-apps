import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  plain,
  query,
  raw,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.mopinion.com";

const mopinion = defineProvider({
  name: "Mopinion",
  hosts: ["api.mopinion.com"],
  auth: {
    apiKey: secrets({
      label: "Feedback API credentials (public key and signature token)",
      fields: object({
        publicKey: plain(string({ minLength: 1 })),
        // Every request is signed with HMAC-SHA256 keyed by this token, so the app must read it.
        signatureToken: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, { signal, headers: await headers(account, "/account") });
    await decodeJson(response, json());
  },
});

type Account = { fields: { publicKey: string; signatureToken: string } };
type Params = Record<string, string | number | undefined>;

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

// x-auth-token = base64(publicKey ":" hmacSha256Hex(signatureToken, resourceUri "|" body)); GET bodies are empty
// and the resource URI excludes the query string.
const headers = async (account: Account, path: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(account.fields.signatureToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${path}|`)));
  return {
    Accept: "application/json",
    version: "3.0.0",
    "x-auth-token": btoa(`${account.fields.publicKey}:${signature}`),
  };
};

const tools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Params = {}, filter?: Readonly<Record<string, string>>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    for (const [key, value] of Object.entries(filter ?? {})) search.set(`filter[${key}]`, value);
    const query = search.toString();
    const response = await fetch(`${base}${path}${query ? `?${query}` : ""}`, {
      signal,
      headers: await headers(account, path),
    });
    return decodeJson(response, json());
  };

  const paging = {
    page: number().optional(),
    limit: number().optional(),
  };
  const feedbackInput = {
    ...paging,
    sort: string().optional(),
    order: string().optional(),
    filter: record(string()).optional(),
  };
  const feedbackNote =
    " limit defaults to 10. sort is created or datetime; order is asc or desc. filter maps a key (optionally prefixed by a modifier ! < << > >>) to a value, e.g. {\"<<nps\": \"5\", \"date_from\": \"2026-01-01\"}; keys are date, date_from, date_to, rating, nps, ces, ces_inverse, gcr, tags. Check _meta.has_more to page.";

  return router({
    account: query(
      { description: "Get the Mopinion account: name, package and limits.", input: object({}) },
      async ({ fetch }) => get(fetch, "/account"),
    ),
    deployments: router(
      {
        list: query(
          { description: "List deployments (the feedback forms and surveys configured in Mopinion).", input: object(paging) },
          async ({ fetch }, input) => get(fetch, "/deployments", input),
        ),
        get: query(
          { description: "Get one deployment by its deployment key.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/deployments/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Deployments", description: "Feedback forms and surveys." },
    ),
    reports: router(
      {
        get: query(
          { description: "Get basic info on a report.", input: object({ id: number() }) },
          async ({ fetch }, { id }) => get(fetch, `/reports/${id}`),
        ),
        fields: query(
          { description: "List the fields (questions) of a report.", input: object({ reportId: number() }) },
          async ({ fetch }, { reportId }) => get(fetch, `/reports/${reportId}/fields`),
        ),
        feedback: query(
          {
            description: `List feedback items of a report.${feedbackNote}`,
            input: object({ reportId: number(), ...feedbackInput }),
          },
          async ({ fetch }, { reportId, filter, ...rest }) =>
            get(fetch, `/reports/${reportId}/feedback`, rest, filter),
        ),
        feedbackItem: query(
          {
            description: "Get one feedback item of a report.",
            input: object({ reportId: number(), id: string() }),
          },
          async ({ fetch }, { reportId, id }) => get(fetch, `/reports/${reportId}/feedback/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Reports", description: "Reports, their fields and feedback." },
    ),
    datasets: router(
      {
        get: query(
          { description: "Get basic info on a dataset.", input: object({ id: number() }) },
          async ({ fetch }, { id }) => get(fetch, `/datasets/${id}`),
        ),
        fields: query(
          { description: "List the fields of a dataset.", input: object({ datasetId: number() }) },
          async ({ fetch }, { datasetId }) => get(fetch, `/datasets/${datasetId}/fields`),
        ),
        feedback: query(
          {
            description: `List feedback items of a dataset.${feedbackNote}`,
            input: object({ datasetId: number(), ...feedbackInput }),
          },
          async ({ fetch }, { datasetId, filter, ...rest }) =>
            get(fetch, `/datasets/${datasetId}/feedback`, rest, filter),
        ),
        feedbackItem: query(
          {
            description: "Get one feedback item of a dataset.",
            input: object({ datasetId: number(), id: string() }),
          },
          async ({ fetch }, { datasetId, id }) => get(fetch, `/datasets/${datasetId}/feedback/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Datasets", description: "Datasets, their fields and feedback." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { mopinion: mopinion.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.mopinion ?? [], (account) => tools(account, signal), { signal }),
      {
        title: "Mopinion",
        description: "Read Mopinion customer feedback: account, deployments, datasets, reports, fields and individual feedback items.",
        icons,
      },
    ),
  }),
);
