import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.creatomate.com/v2";

const creatomate = defineProvider({
  name: "Creatomate",
  hosts: ["api.creatomate.com"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing templates is read-only and returns an array for any valid project key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  "content-type": "application/json",
});

// A 204 has no body, so deletes return a fixed result instead of decoding one.
const creatomateTools = (account: Account, signal: AbortSignal) =>
  router({
    createRender: mutation(
      {
        description:
          "Start a render of a video, image or GIF. Give template_id (optionally with modifications, an object mapping element names or ids to new values such as {\"Title.text\": \"Hello\"}) or give source, a RenderScript JSON object. Returns 202 with the queued render (id, status \"planned\", url); the url only works once status is \"succeeded\", so poll getRender or pass webhook_url. The response may carry errors and warnings arrays: read them. render_scale scales the output (default 1, capped at 3840 px per side); max_width and max_height override it. Rendering spends credits.",
        input: object({
          template_id: string().optional(),
          source: record(json()).optional(),
          modifications: record(json()).optional(),
          render_scale: number().optional(),
          max_width: number().optional(),
          max_height: number().optional(),
          webhook_url: string().optional(),
          metadata: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/renders`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getRender: query(
      {
        description:
          "Get a render by id: status (planned, waiting, transcribing, rendering, succeeded or failed), url, snapshot_url, output_format, width, height, frame_rate, duration, file_size and error_message when failed. The url points to the finished file only when status is succeeded.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/renders/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listTemplates: query(
      {
        description:
          "List the project's templates, newest update first: id, name, tags, created_at and updated_at (no source; use getTemplate for that). tags is a comma-separated list; a template matches if it has any of them. The endpoint is not paginated.",
        input: object({ tags: string().optional() }),
      },
      async ({ fetch }, { tags }) =>
        decodeJson(
          await fetch(`${base}/templates${tags === undefined ? "" : `?tags=${encodeURIComponent(tags)}`}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    getTemplate: query(
      {
        description: "Get one template by id, including its RenderScript source, tags and timestamps.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(
          await fetch(`${base}/templates/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createTemplate: mutation(
      {
        description:
          "Create a template. name labels it; source is its RenderScript JSON (dimensions, elements, animations); tags are optional labels for filtering and batch rendering. Returns 201 with the template. Values the engine would reject give 400 with a hint; values it would ignore are saved and listed in warnings.",
        input: object({
          name: string({ minLength: 1 }),
          source: record(json()),
          tags: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/templates`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    updateTemplate: mutation(
      {
        description:
          "Partially update a template: send at least one of name, tags (replaces all tags) or source (replaces the whole RenderScript). Omitted fields keep their values. Returns the updated template; 404 if it does not exist.",
        input: object({
          id: string(),
          name: string().optional(),
          tags: array(string()).optional(),
          source: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...patch }) =>
        decodeJson(
          await fetch(`${base}/templates/${encodeURIComponent(id)}`, {
            method: "PATCH",
            signal,
            headers: headers(account),
            body: JSON.stringify(patch),
          }),
          json(),
        ),
    ),
    deleteTemplate: mutation(
      {
        description:
          "Delete a template by id. Renders already created from it are unaffected. Returns {deleted: true}; 404 if the template does not exist.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => {
        const response = await fetch(`${base}/templates/${encodeURIComponent(id)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        if (!response.ok) throw new Error(`Creatomate DELETE template failed: ${response.status} ${await response.text()}`);
        return { deleted: true };
      },
    ),
  });

export default defineApp({ user: { accounts: { creatomate: creatomate.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.creatomate ?? [], (account) => creatomateTools(account, signal), { signal }), {
    title: "Creatomate",
    description: "Generate videos, images and GIFs with Creatomate: renders from templates or RenderScript, and template management.",
    icons,
  }),
}));
