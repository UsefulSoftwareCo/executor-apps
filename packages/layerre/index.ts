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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.layerre.com/v1";

const layerre = defineProvider({
  name: "Layerre",
  hosts: ["api.layerre.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "DELETE";

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, options: { query?: Record<string, string | number | boolean | undefined>; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const templateId = string({ minLength: 1 });
const payload = record(json());
const page = { skip: number().optional(), limit: number().optional() };

function build(call: ReturnType<typeof client>) {
  return router({
    templates: router(
      {
        list: query(
          {
            description:
              "List templates, most recently modified first, with variant counts. limit is 1-1000 (default 100). tag filters by tag, q by name substring; includeLayers adds each template's layers.",
            input: object({ ...page, tag: string().optional(), q: string().optional(), includeLayers: boolean().optional() }),
          },
          async (_ctx, { skip, limit, tag, q, includeLayers }) =>
            call("GET", "/templates", { query: { skip, limit, tag, q, include_layers: includeLayers } }),
        ),
        tags: query(
          { description: "List the unique template tags with counts, most used first.", input: object({}) },
          async () => call("GET", "/templates/tags"),
        ),
        get: query(
          {
            description: "Get a template with its layers (ids, types, positions, properties), dimensions and page count. Use the layer ids as overrides when rendering variants.",
            input: object({ templateId }),
          },
          async (_ctx, { templateId }) => call("GET", `/template/${encodeURIComponent(templateId)}`),
        ),
        import: mutation(
          {
            description:
              "Import a Canva design as a template from its public share link (canvaUrl, unescaped). Extracts layers, dimensions and page count. Counts as one render; multi-page designs are limited by plan (Free and Starter import the first page only).",
            input: object({ canvaUrl: string({ minLength: 1 }), tags: array(string()).optional() }),
          },
          async (_ctx, { canvaUrl, tags }) => call("POST", "/template", { body: { canva_url: canvaUrl, ...(tags ? { tags } : {}) } }),
        ),
        update: mutation(
          {
            description:
              "Update a template. body may contain name, width, height, background_color, page_backgrounds (map of page to color), tags (array of strings) and layers (array of layer updates with id).",
            input: object({ templateId, body: payload }),
          },
          async (_ctx, { templateId, body }) => call("PATCH", `/template/${encodeURIComponent(templateId)}`, { body }),
        ),
        delete: mutation(
          { description: "Delete a template (soft delete).", input: object({ templateId }) },
          async (_ctx, { templateId }) => call("DELETE", `/template/${encodeURIComponent(templateId)}`),
        ),
      },
      { title: "Templates", description: "Canva designs imported as reusable templates." },
    ),
    layers: router(
      {
        get: query(
          { description: "Get one layer of a template.", input: object({ templateId, layerId: string({ minLength: 1 }) }) },
          async (_ctx, { templateId, layerId }) =>
            call("GET", `/template/${encodeURIComponent(templateId)}/layer/${encodeURIComponent(layerId)}`),
        ),
        create: mutation(
          {
            description:
              "Add a layer to a template. body: name, layer_type, x, y and properties. Give properties.img_url for an image layer or properties.text for a text layer; other properties include width, height, color, rotation, opacity, font_size, font_name, text_align, image_fit.",
            input: object({ templateId, body: payload }),
          },
          async (_ctx, { templateId, body }) => call("POST", `/template/${encodeURIComponent(templateId)}/layer`, { body }),
        ),
        update: mutation(
          {
            description: "Update a layer's name, position (x, y), stacking position or properties (text, img_url, size, color, font and so on).",
            input: object({ templateId, layerId: string({ minLength: 1 }), body: payload }),
          },
          async (_ctx, { templateId, layerId, body }) =>
            call("PATCH", `/template/${encodeURIComponent(templateId)}/layer/${encodeURIComponent(layerId)}`, { body }),
        ),
        delete: mutation(
          { description: "Delete a layer from a template (soft delete).", input: object({ templateId, layerId: string({ minLength: 1 }) }) },
          async (_ctx, { templateId, layerId }) =>
            call("DELETE", `/template/${encodeURIComponent(templateId)}/layer/${encodeURIComponent(layerId)}`),
        ),
      },
      { title: "Layers", description: "Text and image layers of a template." },
    ),
    variants: router(
      {
        list: query(
          { description: "List rendered variants of a template, with refreshed signed URLs. limit is 1-1000 (default 100).", input: object({ templateId, ...page }) },
          async (_ctx, { templateId, skip, limit }) =>
            call("GET", `/template/${encodeURIComponent(templateId)}/variants`, { query: { skip, limit } }),
        ),
        get: query(
          { description: "Get a rendered variant, refreshing its signed URL if expired.", input: object({ templateId, variantId: string({ minLength: 1 }) }) },
          async (_ctx, { templateId, variantId }) =>
            call("GET", `/template/${encodeURIComponent(templateId)}/variant/${encodeURIComponent(variantId)}`),
        ),
        render: mutation(
          {
            description:
              "Render one variant (consumes a render credit). body: export_type (png, jpeg, webp or pdf), optional width, height, page_number (0-based, default 0) and overrides, an array of { layer_id, properties } such as { text } or { img_url }. Layers not overridden keep template defaults. Returns the signed image URL.",
            input: object({ templateId, body: payload }),
          },
          async (_ctx, { templateId, body }) => call("POST", `/template/${encodeURIComponent(templateId)}/variant`, { body }),
        ),
        renderBulk: mutation(
          {
            description:
              "Render many variants in one request (consumes render credits). body: export_type (one per batch), combine_pdf (merge into one multi-page PDF, Plus plan and above, PDF only) and items, each with overrides and optional width, height, page_number.",
            input: object({ templateId, body: payload }),
          },
          async (_ctx, { templateId, body }) => call("POST", `/template/${encodeURIComponent(templateId)}/variant/bulk`, { body }),
        ),
        delete: mutation(
          { description: "Delete a rendered variant (soft delete).", input: object({ templateId, variantId: string({ minLength: 1 }) }) },
          async (_ctx, { templateId, variantId }) =>
            call("DELETE", `/template/${encodeURIComponent(templateId)}/variant/${encodeURIComponent(variantId)}`),
        ),
      },
      { title: "Variants", description: "Images and PDFs rendered from templates." },
    ),
    analyzeCanvaDesign: query(
      {
        description: "Extract the colors, fonts and images from a public Canva share link without importing it as a template.",
        input: object({ canvaUrl: string({ minLength: 1 }) }),
      },
      async (_ctx, { canvaUrl }) => call("POST", "/analyze/canva-design", { body: { canva_url: canvaUrl } }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { layerre: layerre.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.layerre ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Layerre",
        description: "Render images and PDFs from Canva-based design templates: import templates, edit layers and generate variants.",
        icons,
      },
    ),
  }),
);
