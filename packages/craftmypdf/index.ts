import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const craftmypdf = defineProvider({
  name: "CraftMyPDF",
  hosts: ["api.craftmypdf.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.craftmypdf.com/v1/list-templates", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (!response.ok) throw new Error(`CraftMyPDF rejected the API key (${response.status})`);
    // The spec marks no ResponseListTemplate field as required, so only check that the body is a JSON object.
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { craftmypdf: craftmypdf.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.craftmypdf ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CraftMyPDF",
        description: "Generate PDFs and images from CraftMyPDF templates, and manage templates and template versions.",
        icons,
      },
    ),
  }),
);
