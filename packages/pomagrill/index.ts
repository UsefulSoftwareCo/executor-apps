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

const pomagrill = defineProvider({
  name: "POMA Grill",
  hosts: ["api.poma-ai.com"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /projects/info accepts only a project API key and returns the bound project.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.poma-ai.com/v3/projects/info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { pomagrill: pomagrill.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pomagrill ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "POMA Grill",
        description: "Ingest documents into a POMA Grill project, search them for prompt-ready context, and manage documents, jobs and projects.",
        icons,
      },
    ),
  }),
);
