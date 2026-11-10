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

const base = "https://api.dribbble.com/v2";

const dribbble = defineProvider({
  name: "Dribbble",
  hosts: ["api.dribbble.com"],
  auth: {
    // Dribbble documents OAuth only (authorization-code flow); the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://dribbble.com/oauth/authorize",
      tokenUrl: "https://dribbble.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["public", "upload"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.fields.access_token;
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const user = await decodeJson(response, object({ id: number(), login: string() }));
    return { accountInfo: { externalId: String(user.id), displayName: user.login } };
  },
});

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
  Accept: "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const bytes = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

const dribbbleTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetch(`${base}${path}`, {
      method,
      signal,
      headers: { ...headers(account), ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    // The docs say both "JSON" and Content-Type application/x-www-form-urlencoded for bodies; JSON is sent.
    // Create/delete may answer 202 or 204 with an empty body.
    const text = await response.text();
    if (!response.ok) throw new Error(`Dribbble ${method} ${path} failed with ${response.status}: ${text}`);
    return {
      status: response.status,
      location: response.headers.get("location") ?? undefined,
      body: text ? (JSON.parse(text) as unknown) : undefined,
    };
  };
  const clean = (input: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));

  return router({
    getUser: query(
      {
        description:
          "Get the authenticated user: id, name, login, bio, avatar, links, pro status, whether they can upload shots, follower count and teams.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/user"),
    ),
    listShots: query(
      {
        description:
          "List the authenticated user's shots. perPage is up to 100 (default 30); page starts at 1.",
        input: object({ page: number().optional(), perPage: number().optional() }),
      },
      async ({ fetch }, { page, perPage }) =>
        get(fetch, `/user/shots?${search({ page, per_page: perPage })}`),
    ),
    getShot: query(
      {
        description:
          "Get one of the authenticated user's shots by id, with images, tags, attachments, projects, team and video details. Only shots owned by the user are returned.",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) => get(fetch, `/shots/${id}`),
    ),
    createShot: mutation(
      {
        description:
          "Create a shot from an image. Needs the upload scope and a player or team account. imageBase64 is the base64-encoded file (GIF, JPG or PNG, exactly 400x300 or 800x600, at most 8 MB). scheduledFor is an ISO 8601 time (pro, team or team member). tags are limited to 12. Processing is asynchronous: the returned location 404s until it finishes. Video shots are not supported by the API.",
        input: object({
          title: string(),
          imageBase64: string(),
          fileName: string().optional(),
          mimeType: string().optional(),
          description: string().optional(),
          lowProfile: boolean().optional(),
          reboundSourceId: number().optional(),
          scheduledFor: string().optional(),
          tags: array(string()).optional(),
          teamId: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        form.set(
          "image",
          new Blob([bytes(input.imageBase64)], { type: input.mimeType ?? "image/png" }),
          input.fileName ?? "shot.png",
        );
        form.set("title", input.title);
        if (input.description !== undefined) form.set("description", input.description);
        if (input.lowProfile !== undefined) form.set("low_profile", String(input.lowProfile));
        if (input.reboundSourceId !== undefined) form.set("rebound_source_id", String(input.reboundSourceId));
        if (input.scheduledFor !== undefined) form.set("scheduled_for", input.scheduledFor);
        if (input.teamId !== undefined) form.set("team_id", String(input.teamId));
        for (const tag of input.tags ?? []) form.append("tags[]", tag);
        const response = await fetch(`${base}/shots`, { method: "POST", signal, headers: headers(account), body: form });
        const text = await response.text();
        if (!response.ok) throw new Error(`Dribbble POST /shots failed with ${response.status}: ${text}`);
        return { status: response.status, location: response.headers.get("location") ?? undefined };
      },
    ),
    updateShot: mutation(
      {
        description:
          "Update a shot you own (upload scope). tags replaces the whole tag list (max 12; omitted existing tags are removed). teamId set to 0 removes the team association. scheduledFor reschedules an unpublished shot.",
        input: object({
          id: number(),
          title: string().optional(),
          description: string().optional(),
          lowProfile: boolean().optional(),
          scheduledFor: string().optional(),
          tags: array(string()).optional(),
          teamId: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...input }) =>
        send(
          fetch,
          "PUT",
          `/shots/${id}`,
          clean({
            title: input.title,
            description: input.description,
            low_profile: input.lowProfile,
            scheduled_for: input.scheduledFor,
            tags: input.tags,
            team_id: input.teamId === 0 ? "" : input.teamId,
          }),
        ),
    ),
    deleteShot: mutation(
      {
        description: "Permanently delete a shot you own (upload scope).",
        input: object({ id: number() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send(fetch, "DELETE", `/shots/${id}`),
    ),
    createAttachment: mutation(
      {
        description:
          "Attach a file (at most 10 MB) to a shot you own. Needs the upload scope and a pro, team or team-member account. fileBase64 is the base64-encoded file. Processing is asynchronous, so the attachment appears on the shot later.",
        input: object({
          shotId: number(),
          fileBase64: string(),
          fileName: string(),
          mimeType: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        form.set(
          "file",
          new Blob([bytes(input.fileBase64)], { type: input.mimeType ?? "application/octet-stream" }),
          input.fileName,
        );
        const response = await fetch(`${base}/shots/${input.shotId}/attachments`, {
          method: "POST",
          signal,
          headers: headers(account),
          body: form,
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`Dribbble attachment upload failed with ${response.status}: ${text}`);
        return { status: response.status };
      },
    ),
    deleteAttachment: mutation(
      {
        description: "Delete an attachment you own from one of your shots (upload scope).",
        input: object({ shotId: number(), id: number() }),
        approval: always(),
      },
      async ({ fetch }, { shotId, id }) => send(fetch, "DELETE", `/shots/${shotId}/attachments/${id}`),
    ),
    listProjects: query(
      {
        description: "List the authenticated user's projects (collections of shots) with names, descriptions and shot counts.",
        input: object({ page: number().optional(), perPage: number().optional() }),
      },
      async ({ fetch }, { page, perPage }) =>
        get(fetch, `/user/projects?${search({ page, per_page: perPage })}`),
    ),
    createProject: mutation(
      {
        description: "Create a project with a name and optional description.",
        input: object({ name: string(), description: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/projects", clean(input)),
    ),
    updateProject: mutation(
      {
        description: "Rename a project or change its description.",
        input: object({ id: number(), name: string().optional(), description: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...input }) => send(fetch, "PUT", `/projects/${id}`, clean(input)),
    ),
    deleteProject: mutation(
      {
        description: "Delete a project.",
        input: object({ id: number() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send(fetch, "DELETE", `/projects/${id}`),
    ),
  });
};

export default defineApp({ user: { accounts: { dribbble: dribbble.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.dribbble ?? [], (account) => dribbbleTools(account, signal), { signal }), {
    title: "Dribbble",
    description: "Shots, projects and attachments on your Dribbble account.",
    icons,
  }),
}));
