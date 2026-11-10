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

const carbone = defineProvider({
  name: "Carbone",
  hosts: ["api.carbone.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /templates needs a valid key and has no side effects.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.carbone.io/templates?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "carbone-version": "5" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { carbone: carbone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.carbone ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: { headers: { "carbone-version": "5" } },
            }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Carbone",
        description: "Generate and convert documents with Carbone: manage templates and render them with JSON data to PDF, DOCX, XLSX and more.",
        icons,
      },
    ),
  }),
);
