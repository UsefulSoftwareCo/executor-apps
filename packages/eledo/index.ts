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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Eledo REST API v1: https://eledo.online/documentation/api_reference
const base = "https://eledo.online/api/RESTv1";

const eledo = defineProvider({
  name: "Eledo PDF",
  hosts: ["eledo.online"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/Profile`, { signal, headers: { "Api-Key": account.fields.token } });
    const body = await decodeJson(response, object({ account: string() }));
    return { accountInfo: { externalId: body.account, displayName: body.account } };
  },
});

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function filenameOf(response: Response): string | null {
  const header = response.headers.get("content-disposition");
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? null;
}

async function pdf(response: Response) {
  if (!response.ok || !(response.headers.get("content-type") ?? "").includes("application/pdf")) {
    throw new Error(`Eledo returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { filename: filenameOf(response), contentType: "application/pdf", sizeBytes: bytes.length, base64: toBase64(bytes) };
}

const Generate = object({
  templateId: string({ minLength: 1 }),
  templateVersion: number().optional(),
  data: json().optional(),
});

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { "Api-Key": token };
  const jsonHeaders = { ...headers, "content-type": "application/json" };
  return router({
    profile: query(
      { description: "Show which Eledo account the API key belongs to.", input: object({}) },
      async () => decodeJson(await fetcher(`${base}/Profile`, { signal, headers }), object({ account: string() })),
    ),
    listTemplates: query(
      {
        description: "List templates, with ids, names and versions. Scope is Mine (default) or Public.",
        input: object({ scope: string().optional(), limit: number().optional(), page: number().optional() }),
      },
      async (_ctx, input) => {
        const params = new URLSearchParams();
        if (input.scope) params.set("scope", input.scope);
        if (input.limit !== undefined) params.set("limit", String(input.limit));
        if (input.page !== undefined) params.set("page", String(input.page));
        const qs = params.size ? `?${params}` : "";
        return decodeJson(
          await fetcher(`${base}/List${qs}`, { signal, headers }),
          object({
            total: number().optional(),
            templates: array(
              object({ id: string(), name: string(), version: number().optional(), bulk: boolean().optional() }),
            ),
          }),
        );
      },
    ),
    getTemplateSchema: query(
      {
        description:
          "Get the input structure of a template (keys, types, nested fields, list flags) to build the data payload for generation. schemaType is eledo (default), zapier or integromat.",
        input: object({ templateId: string({ minLength: 1 }), templateVersion: number().optional(), schemaType: string().optional() }),
      },
      async (_ctx, input) => {
        const path = `${base}/Schema/${encodeURIComponent(input.templateId)}${input.templateVersion !== undefined ? `/${input.templateVersion}` : ""}`;
        const qs = input.schemaType ? `?schemaType=${encodeURIComponent(input.schemaType)}` : "";
        return decodeJson(await fetcher(path + qs, { signal, headers }), json());
      },
    ),
    generateDocument: mutation(
      {
        description:
          "Generate a PDF from a template and data (shaped per getTemplateSchema). Returns the PDF as base64 with its filename.",
        input: Generate,
        approval: always(),
      },
      async (_ctx, input) =>
        pdf(
          await fetcher(`${base}/Generate`, {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify({ templateId: input.templateId, templateVersion: input.templateVersion, file: input.data ?? null }),
          }),
        ),
    ),
    createFile: mutation(
      {
        description:
          "Store template data on the server and return a download URL (asynchronous flow). Set temporary to delete the file after its first download.",
        input: object({
          templateId: string({ minLength: 1 }),
          templateVersion: number().optional(),
          data: json().optional(),
          temporary: boolean().optional(),
        }),
        approval: always(),
      },
      async (_ctx, input) =>
        decodeJson(
          await fetcher(`${base}/CreateFile`, {
            method: "POST",
            signal,
            headers: jsonHeaders,
            body: JSON.stringify({
              templateId: input.templateId,
              templateVersion: input.templateVersion,
              file: input.data ?? null,
              temporary: input.temporary,
            }),
          }),
          json(),
        ),
    ),
    downloadFile: query(
      {
        description: "Download the PDF of a file made with createFile, by file id (the last segment of its URL). Returns base64.",
        input: object({ fileId: string({ minLength: 1 }) }),
      },
      async (_ctx, input) => pdf(await fetcher(`${base}/Download/${encodeURIComponent(input.fileId)}`, { signal, headers })),
    ),
  });
}

export default defineApp(
  { user: { accounts: { eledo: eledo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.eledo ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Eledo PDF",
        description: "Generate PDF documents from Eledo templates and JSON data: list templates, read schemas, generate and download.",
        icons,
      },
    ),
  }),
);
