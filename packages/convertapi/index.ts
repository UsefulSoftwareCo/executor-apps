import { accountRouter, boolean, decodeJson, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const convertapi = defineProvider({
  name: "ConvertAPI",
  hosts: ["v2.convertapi.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Authenticates the admin endpoints (GET /user, GET /user/statistic); one per account.
    masterToken: secrets({
      label: "Master token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Only the Master token can read /user; an API token account has no read-only endpoint to check.
  async health({ account, fetch, signal }) {
    if (account.method !== "masterToken") return;
    const response = await fetch("https://v2.convertapi.com/user", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ Active: boolean(), Email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { convertapi: convertapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.convertapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ConvertAPI",
        description: "Convert files between 200+ formats with ConvertAPI: documents, spreadsheets, images, PDF, web pages, barcodes and more.",
        icons,
      },
    ),
  }),
);
