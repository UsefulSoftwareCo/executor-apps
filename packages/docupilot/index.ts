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

const docupilot = defineProvider({
  name: "Docupilot",
  hosts: ["api-us1.docupilot.app"],
  auth: {
    apiKey: secrets({
      label: "API credentials (base64 of key:secret)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api-us1.docupilot.app/dashboard/accounts/v2/users/me/", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { docupilot: docupilot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docupilot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Docupilot",
        description: "Docupilot document automation: templates, folders, content blocks, document generation, merges and deliveries.",
        icons,
        instructions: "Workspace-scoped operations require the X-Workspace header parameter set to the workspace ID (Settings > Workspace details in Docupilot).",
      },
    ),
  }),
);
