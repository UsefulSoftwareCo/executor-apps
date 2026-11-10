import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  oauth2,
  object,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.imejis.io/api/mcp";
const renderUrl = "https://render.imejis.io/v1";

const imejisio = defineProvider({
  name: "Imejis.io",
  // Hosts are part of provider identity: the MCP server takes OAuth tokens, the render API takes keys.
  hosts: ["api.imejis.io", "render.imejis.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
      request: ({ token }) => header("dma-api-key", token),
    }),
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    // No side-effect-free authenticated read exists for render keys. The render host checks the key
    // before the design lookup, so an unknown design id rejects only a bad key ("Key not found").
    const response = await fetch(`${renderUrl}/health-check-unknown-design`, {
      signal,
      headers: account.headers(),
    });
    const body = await decodeJson(response, object({ error: string() })).catch(() => undefined);
    if (response.status === 401 || body?.error === "Key not found") throw new Error("Imejis rejected the API key");
  },
});

export default defineApp(
  { user: { accounts: { imejisio: imejisio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.imejisio ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          // Render API keys are not accepted by the MCP server, so key accounts get the render endpoint only.
          return router({
            render: mutation(
              {
                description:
                  "Render a design template to a hosted file (png, jpeg, webp or pdf) via POST https://render.imejis.io/v1/{design_id}. Each render counts as one API call. Returns the stored URL; image bytes are never returned.",
                approval: always(),
                input: object({
                  designId: string({ minLength: 1 }),
                  overrides: record(json()).default({}),
                  format: string().default("png"),
                  quality: number().optional(),
                  delivery: string().default("hosted"),
                  expiresIn: number().optional(),
                }),
              },
              async (_ctx, input) => {
                const params = new URLSearchParams({ format: input.format, delivery: input.delivery });
                if (input.quality !== undefined) params.set("quality", String(input.quality));
                if (input.expiresIn !== undefined) params.set("expiresIn", String(input.expiresIn));
                const response = await fetch(
                  `${renderUrl}/${encodeURIComponent(input.designId)}?${params.toString()}`,
                  {
                    method: "POST",
                    signal,
                    headers: { ...account.headers(), "content-type": "application/json" },
                    body: JSON.stringify(input.overrides),
                  },
                );
                return await decodeJson(response, json());
              },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Imejis.io",
        description: "Design templates and render images and PDFs with Imejis.io.",
        icons,
      },
    ),
  }),
);
