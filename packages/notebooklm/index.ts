import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// NotebookLM Enterprise API (Discovery Engine v1alpha, preview). The service is served from one
// host per endpoint location: https://{us-|eu-|}discoveryengine.googleapis.com.
const hosts = {
  global: "discoveryengine.googleapis.com",
  us: "us-discoveryengine.googleapis.com",
  eu: "eu-discoveryengine.googleapis.com",
} as const;

const notebooklm = defineProvider({
  name: "NotebookLM",
  hosts: [...Object.values(hosts), "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/discoveryengine.readwrite"],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, object({ sub: string() }));
    return { accountInfo: { externalId: me.sub } };
  },
});

const where = {
  project: string({ minLength: 1 }),
  location: string().optional(),
  endpointLocation: string().optional(),
};

type Where = { project: string; location?: string; endpointLocation?: string };

const whereHelp =
  " project is the Google Cloud project NUMBER (not the id). location is the data store location (default global). endpointLocation is global, us or eu (default global) and selects the API host.";

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (w: Where, path: string, init: { method?: string; body?: unknown; params?: Record<string, string | number | undefined> } = {}) => {
    const endpoint = w.endpointLocation ?? "global";
    if (!(endpoint in hosts)) throw new Error(`Unknown endpointLocation "${endpoint}". Use global, us or eu.`);
    const host = hosts[endpoint as keyof typeof hosts];
    const root = `projects/${encodeURIComponent(w.project)}/locations/${encodeURIComponent(w.location ?? "global")}`;
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(init.params ?? {})) if (v !== undefined) search.set(k, String(v));
    const qs = search.size ? `?${search}` : "";
    const response = await fetcher(`https://${host}/v1alpha/${root}${path}${qs}`, {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    return decodeJson(response, json());
  };
  const nb = (id: string) => `/notebooks/${encodeURIComponent(id)}`;
  const fullName = (w: Where, notebookId: string, rest: string) =>
    `projects/${w.project}/locations/${w.location ?? "global"}/notebooks/${notebookId}${rest}`;

  return router({
    notebooks: router({
      listRecentlyViewed: query(
        {
          description: "List recently viewed notebooks (up to the last 500 by default)." + whereHelp,
          input: object({ ...where, pageSize: number().optional(), pageToken: string().optional() }),
        },
        async (_ctx, i) =>
          call(i, "/notebooks:listRecentlyViewed", { params: { pageSize: i.pageSize, pageToken: i.pageToken } }),
      ),
      get: query(
        {
          description: "Get a notebook, including its sources, by notebook id." + whereHelp,
          input: object({ ...where, notebookId: string({ minLength: 1 }) }),
        },
        async (_ctx, i) => call(i, nb(i.notebookId)),
      ),
      create: mutation(
        {
          description: "Create a notebook with the given title." + whereHelp,
          input: object({ ...where, title: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, i) => call(i, "/notebooks", { method: "POST", body: { title: i.title } }),
      ),
      delete: mutation(
        {
          description: "Delete notebooks by id (notebooks:batchDelete). Succeeds with {} even if a notebook does not exist." + whereHelp,
          input: object({ ...where, notebookIds: array(string({ minLength: 1 })) }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, "/notebooks:batchDelete", {
            method: "POST",
            body: { names: i.notebookIds.map((id) => fullName(i, id, "")) },
          }),
      ),
      share: mutation(
        {
          description:
            "Share a notebook with people. Each entry in accountAndRoles has an email and a role: PROJECT_ROLE_OWNER, PROJECT_ROLE_WRITER, PROJECT_ROLE_READER or PROJECT_ROLE_NOT_SHARED (removes access). Recipients need the Cloud NotebookLM User IAM role in the project." +
            whereHelp,
          input: object({
            ...where,
            notebookId: string({ minLength: 1 }),
            accountAndRoles: array(object({ email: string({ minLength: 1 }), role: string({ minLength: 1 }) })),
            notifyViaEmail: boolean().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, `${nb(i.notebookId)}:share`, {
            method: "POST",
            body: {
              accountAndRoles: i.accountAndRoles,
              ...(i.notifyViaEmail === undefined ? {} : { notifyViaEmail: i.notifyViaEmail }),
            },
          }),
      ),
    }),
    sources: router({
      get: query(
        {
          description: "Get a source of a notebook, including its ingestion status and any failure reason." + whereHelp,
          input: object({ ...where, notebookId: string({ minLength: 1 }), sourceId: string({ minLength: 1 }) }),
        },
        async (_ctx, i) => call(i, `${nb(i.notebookId)}/sources/${encodeURIComponent(i.sourceId)}`),
      ),
      batchCreate: mutation(
        {
          description:
            'Add sources to a notebook. Each item of userContents is exactly one of: { textContent: { sourceName, content } }, { webContent: { url, sourceName? } }, { videoContent: { youtubeUrl } }, { googleDriveContent: { documentId, mimeType, sourceName } }.' +
            whereHelp,
          input: object({
            ...where,
            notebookId: string({ minLength: 1 }),
            userContents: array(json()),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, `${nb(i.notebookId)}/sources:batchCreate`, { method: "POST", body: { userContents: i.userContents } }),
      ),
      batchDelete: mutation(
        {
          description: "Remove sources from a notebook by source id." + whereHelp,
          input: object({
            ...where,
            notebookId: string({ minLength: 1 }),
            sourceIds: array(string({ minLength: 1 })),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, `${nb(i.notebookId)}/sources:batchDelete`, {
            method: "POST",
            body: { names: i.sourceIds.map((id) => fullName(i, i.notebookId, `/sources/${id}`)) },
          }),
      ),
    }),
    audioOverviews: router({
      create: mutation(
        {
          description:
            "Generate an audio overview (podcast-style discussion) of a notebook. Optional generationOptions: sourceIds (restrict to these sources), episodeFocus (what to emphasize), languageCode (BCP-47)." +
            whereHelp,
          input: object({
            ...where,
            notebookId: string({ minLength: 1 }),
            generationOptions: json().optional(),
          }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, `${nb(i.notebookId)}/audioOverviews`, {
            method: "POST",
            body: i.generationOptions === undefined ? {} : { generationOptions: i.generationOptions },
          }),
      ),
      delete: mutation(
        {
          description: "Delete an audio overview of a notebook." + whereHelp,
          input: object({ ...where, notebookId: string({ minLength: 1 }), audioOverviewId: string({ minLength: 1 }) }),
          approval: always(),
        },
        async (_ctx, i) =>
          call(i, `${nb(i.notebookId)}/audioOverviews/${encodeURIComponent(i.audioOverviewId)}`, { method: "DELETE" }),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { notebooklm: notebooklm.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.notebooklm ?? [], (account) => build(account.fields.access_token, fetch, signal), {
        signal,
      }),
      {
        title: "NotebookLM",
        description:
          "NotebookLM Enterprise: create, share and delete notebooks, add and remove sources, and generate audio overviews.",
        icons,
      },
    ),
  }),
);
