import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.draftable.com/v1";

const draftable = defineProvider({
  name: "Draftable",
  hosts: ["api.draftable.com"],
  auth: {
    apiKey: secrets({
      label: "Account ID and auth token",
      fields: object({ accountId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/comparisons`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Token ${token}` };
  return {
    get: async (path: string) => decodeJson(await fetcher(`${base}${path}`, { signal, headers }), json()),
    post: async (path: string, body: Record<string, unknown>) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        json(),
      ),
    del: async (path: string) => {
      const response = await fetcher(`${base}${path}`, { method: "DELETE", signal, headers });
      if (!response.ok) throw new Error(`Draftable DELETE ${path} failed (${response.status}): ${await response.text()}`);
      return { deleted: true };
    },
  };
}

const side = () =>
  object({
    sourceUrl: string({ minLength: 1 }),
    fileType: string({ minLength: 1 }),
    displayName: string().optional(),
  });

function build(api: ReturnType<typeof client>, accountId: string) {
  return router({
    comparisons: router(
      {
        list: query(
          {
            description: "List all comparisons on the account, newest first. Can be slow on accounts with many comparisons.",
            input: object({}),
          },
          async () => api.get("/comparisons"),
        ),
        get: query(
          {
            description:
              "Get one comparison by identifier. Check `ready` and `failed` (with `error_message`) to see whether processing finished.",
            input: object({ identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { identifier }) => api.get(`/comparisons/${encodeURIComponent(identifier)}`),
        ),
        viewerUrl: query(
          {
            description:
              "Build the viewer URL for a comparison. It only loads for comparisons created with public=true; private ones need a signed URL, which this tool does not generate. Set wait to make the viewer wait for a comparison that is still being created.",
            input: object({ identifier: string({ minLength: 1 }), wait: boolean().optional() }),
          },
          async (_ctx, { identifier, wait }) => ({
            url: `${base}/comparisons/viewer/${encodeURIComponent(accountId)}/${encodeURIComponent(identifier)}${wait ? "?wait" : ""}`,
          }),
        ),
        create: mutation(
          {
            description:
              "Compare two documents fetched by Draftable from public URLs. fileType is one of pdf, docx, docm, doc, rtf, pptx, pptm, ppt, txt. Optional identifier must be unused; public makes the viewer URL open to anyone; expiryTime is a future UTC ISO 8601 time after which the comparison is deleted. Uploading file bytes is not supported by this tool.",
            input: object({
              left: side(),
              right: side(),
              identifier: string().optional(),
              public: boolean().optional(),
              expiryTime: string().optional(),
            }),
          },
          async (_ctx, { left, right, identifier, public: isPublic, expiryTime }) => {
            const toSide = (s: { sourceUrl: string; fileType: string; displayName?: string | undefined }) => ({
              source_url: s.sourceUrl,
              file_type: s.fileType,
              ...(s.displayName === undefined ? {} : { display_name: s.displayName }),
            });
            return api.post("/comparisons", {
              left: toSide(left),
              right: toSide(right),
              ...(identifier === undefined ? {} : { identifier }),
              ...(isPublic === undefined ? {} : { public: isPublic }),
              ...(expiryTime === undefined ? {} : { expiry_time: expiryTime }),
            });
          },
        ),
        delete: mutation(
          {
            description: "Permanently delete a comparison by identifier.",
            input: object({ identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { identifier }) => api.del(`/comparisons/${encodeURIComponent(identifier)}`),
        ),
      },
      { title: "Comparisons", description: "Create, inspect and delete document comparisons." },
    ),
    exports: router(
      {
        create: mutation(
          {
            description:
              "Request a PDF export of a comparison. kind is single_page (right document with highlights), combined (both sides), left or right. Then poll exports.get until `ready` is true to obtain the download URL.",
            input: object({
              comparison: string({ minLength: 1 }),
              kind: string({ minLength: 1 }),
              includeCoverPage: boolean().optional(),
            }),
          },
          async (_ctx, { comparison, kind, includeCoverPage }) =>
            api.post("/exports", {
              comparison,
              kind,
              ...(includeCoverPage === undefined ? {} : { include_cover_page: includeCoverPage }),
            }),
        ),
        get: query(
          {
            description: "Get an export by identifier; `ready` and `failed` show progress, `url` is the PDF once ready.",
            input: object({ identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { identifier }) => api.get(`/exports/${encodeURIComponent(identifier)}`),
        ),
      },
      { title: "Exports", description: "Export comparisons to PDF." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { draftable: draftable.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.draftable ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal), account.fields.accountId), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Draftable",
        description: "Compare PDF, Word, PowerPoint and text documents and export the differences to PDF.",
        icons,
      },
    ),
  }),
);
