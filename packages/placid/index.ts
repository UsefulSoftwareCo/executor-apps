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
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.placid.app/api/rest";

const placid = defineProvider({
  name: "Placid",
  hosts: ["api.placid.app"],
  auth: {
    apiKey: secrets({
      label: "Project API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Tokens belong to one project; listing collections is free and needs no other setup.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/collections?per_page=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  const send = async (method: string, path: string, body?: Params, params?: Params) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { deleted: true };
    if (method === "DELETE" && response.ok && (await response.clone().text()).trim() === "") {
      return { deleted: true };
    }
    return decodeJson(response, json());
  };
  return {
    get: (path: string, params?: Params) => send("GET", path, undefined, params),
    post: (path: string, body: Params) => send("POST", path, body),
    patch: (path: string, body: Params) => send("PATCH", path, body),
    del: (path: string, params?: Params) => send("DELETE", path, undefined, params),
    // Pagination links are absolute URLs on the API host.
    next: async (link: string) => {
      const target = new URL(link);
      if (target.origin !== "https://api.placid.app") throw new Error("Refusing to follow a link outside api.placid.app");
      return decodeJson(await fetcher(target.toString(), { signal, headers }), json());
    },
  };
}

const Layers = record(json());
const Modifications = record(json());
const Transfer = record(json());
const Id = object({ id: string({ minLength: 1 }) });

const build = (c: ReturnType<typeof client>) =>
  router({
    images: router(
      {
        create: mutation(
          {
            description:
              "Render an image from a template. layers is keyed by layer name, e.g. { title: { text: \"Hello\" }, photo: { image: \"https://...\" } }. Returns an id, status and polling_url; poll images.get until status is finished, or set webhook_success. create_now renders immediately instead of queueing. Consumes credits.",
            input: object({
              template_uuid: string({ minLength: 1 }),
              layers: Layers.optional(),
              modifications: Modifications.optional(),
              transfer: Transfer.optional(),
              webhook_success: string().optional(),
              create_now: boolean().optional(),
              passthrough: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/images", input),
        ),
        get: query(
          { description: "Retrieve an image by id: status (queued, finished, error) and image_url.", input: Id },
          async (_ctx, { id }) => c.get(`/images/${encodeURIComponent(id)}`),
        ),
        delete: mutation(
          { description: "Permanently delete a generated image by id.", input: Id, approval: always() },
          async (_ctx, { id }) => c.del(`/images/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Images", description: "Generate images from templates." },
    ),
    pdfs: router(
      {
        create: mutation(
          {
            description:
              "Render a PDF from one or more template pages. pages is an array of { template_uuid, layers } merged in order. Poll pdfs.get until status is finished. Consumes credits (2 per page).",
            input: object({
              pages: array(object({ template_uuid: string({ minLength: 1 }), layers: Layers.optional() })),
              modifications: Modifications.optional(),
              transfer: Transfer.optional(),
              webhook_success: string().optional(),
              passthrough: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/pdfs", input),
        ),
        merge: mutation(
          {
            description: "Merge 2 to 10 existing PDFs, given by URL, into one PDF. Poll pdfs.get for the result.",
            input: object({
              urls: array(string({ minLength: 1 })),
              transfer: Transfer.optional(),
              webhook_success: string().optional(),
              passthrough: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/pdfs/merge", input),
        ),
        get: query(
          { description: "Retrieve a PDF by id: status (queued, finished, error) and pdf_url.", input: Id },
          async (_ctx, { id }) => c.get(`/pdfs/${encodeURIComponent(id)}`),
        ),
        delete: mutation(
          { description: "Permanently delete a generated PDF by id.", input: Id, approval: always() },
          async (_ctx, { id }) => c.del(`/pdfs/${encodeURIComponent(id)}`),
        ),
      },
      { title: "PDFs", description: "Generate and merge PDFs." },
    ),
    videos: router(
      {
        create: mutation(
          {
            description:
              "Render a video from one or more clips (max 180 seconds total). clips is an array of { template_uuid, layers, audio, audio_duration, audio_trim_start, audio_trim_end } merged in order. Poll videos.get until status is finished. Consumes credits (10 per 10 seconds).",
            input: object({
              clips: array(record(json())),
              modifications: Modifications.optional(),
              transfer: Transfer.optional(),
              webhook_success: string().optional(),
              passthrough: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/videos", input),
        ),
        get: query(
          { description: "Retrieve a video by id: status (queued, finished, error) and its URL once ready.", input: Id },
          async (_ctx, { id }) => c.get(`/videos/${encodeURIComponent(id)}`),
        ),
        delete: mutation(
          { description: "Permanently delete a generated video by id.", input: Id, approval: always() },
          async (_ctx, { id }) => c.del(`/videos/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Videos", description: "Generate videos from templates." },
    ),
    templates: router(
      {
        list: query(
          {
            description:
              "List templates (20 per page, cursor-paginated: pass the links.next URL to templates.nextPage). Each template lists its dynamic layers. order_by is <created_at|updated_at|title>-<asc|desc>.",
            input: object({
              collection_id: string().optional(),
              title_filter: string().optional(),
              tag: string().optional(),
              order_by: string().optional(),
            }),
          },
          async (_ctx, input) => c.get("/templates", input),
        ),
        nextPage: query(
          {
            description: "Fetch another page of templates or collections from a links.next or links.prev URL returned by a list call.",
            input: object({ link: string({ minLength: 1 }) }),
          },
          async (_ctx, { link }) => c.next(link),
        ),
        get: query(
          {
            description: "Retrieve a template by uuid, including its dynamic layers.",
            input: object({ template_uuid: string({ minLength: 1 }) }),
          },
          async (_ctx, { template_uuid }) => c.get(`/templates/${encodeURIComponent(template_uuid)}`),
        ),
        create: mutation(
          {
            description:
              "Create an empty template with a size, or duplicate one with from_template (overriding title, width and height). Up to 10 tags.",
            input: object({
              title: string({ minLength: 1 }),
              width: number().optional(),
              height: number().optional(),
              tags: array(string()).optional(),
              custom_data: string().optional(),
              from_template: string().optional(),
              add_to_collections: array(string()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/templates", input),
        ),
        update: mutation(
          {
            description: "Update a template's title, tags or custom_data.",
            input: object({
              template_uuid: string({ minLength: 1 }),
              title: string().optional(),
              tags: array(string()).optional(),
              custom_data: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { template_uuid, ...body }) => c.patch(`/templates/${encodeURIComponent(template_uuid)}`, body),
        ),
        delete: mutation(
          {
            description: "Permanently delete a template by uuid.",
            input: object({ template_uuid: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { template_uuid }) => c.del(`/templates/${encodeURIComponent(template_uuid)}`),
        ),
      },
      { title: "Templates", description: "Browse and manage design templates." },
    ),
    collections: router(
      {
        list: query(
          {
            description:
              "List collections of templates. Without per_page every collection is returned; with it (max 100) results are cursor-paginated, continue with templates.nextPage.",
            input: object({ per_page: number().optional() }),
          },
          async (_ctx, input) => c.get("/collections", input),
        ),
        get: query(
          { description: "Retrieve a collection by id, including its template_uuids.", input: Id },
          async (_ctx, { id }) => c.get(`/collections/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description: "Create a collection, optionally with up to 500 template uuids.",
            input: object({
              title: string({ minLength: 1 }),
              custom_data: string().optional(),
              template_uuids: array(string()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/collections", input),
        ),
        update: mutation(
          {
            description:
              "Update a collection. template_uuids replaces the whole list; add_template_uuids and remove_template_uuids change it incrementally.",
            input: object({
              id: string({ minLength: 1 }),
              title: string().optional(),
              custom_data: string().optional(),
              template_uuids: array(string()).optional(),
              add_template_uuids: array(string()).optional(),
              remove_template_uuids: array(string()).optional(),
            }),
            approval: always(),
          },
          async (_ctx, { id, ...body }) => c.patch(`/collections/${encodeURIComponent(id)}`, body),
        ),
        delete: mutation(
          { description: "Delete a collection by id. Its templates are kept.", input: Id, approval: always() },
          async (_ctx, { id }) => c.del(`/collections/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Collections", description: "Group templates into collections." },
    ),
    fonts: router(
      {
        list: query(
          {
            description: "List the project's custom fonts. A font's uuid is the fontFamily value for text layers.",
            input: object({ include_legacy: boolean().optional() }),
          },
          async (_ctx, { include_legacy }) => c.get("/fonts", { include_legacy: include_legacy === undefined ? undefined : include_legacy ? 1 : 0 }),
        ),
        get: query(
          { description: "Retrieve a custom font by uuid.", input: object({ uuid: string({ minLength: 1 }) }) },
          async (_ctx, { uuid }) => c.get(`/fonts/${encodeURIComponent(uuid)}`),
        ),
        rename: mutation(
          {
            description: "Change a font's title (max 200 characters).",
            input: object({ uuid: string({ minLength: 1 }), title: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { uuid, title }) => c.patch(`/fonts/${encodeURIComponent(uuid)}`, { title }),
        ),
        delete: mutation(
          {
            description:
              "Delete a font. Fails with 409 listing templates_using_font unless force is true; forced deletion leaves layers falling back to the default font.",
            input: object({ uuid: string({ minLength: 1 }), force: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, { uuid, force }) =>
            c.del(`/fonts/${encodeURIComponent(uuid)}`, { force: force === undefined ? undefined : force ? 1 : 0 }),
        ),
      },
      { title: "Fonts", description: "Manage custom fonts used by text layers." },
    ),
  });

export default defineApp(
  { user: { accounts: { placid: placid.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.placid ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Placid",
        description:
          "Placid creative automation: generate images, PDFs and videos from templates, and manage templates, collections and fonts.",
        icons,
      },
    ),
  }),
);
