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

// GET /v3/self answers every principal type (service user, PAT, ...) and each
// variant of its schema requires principal_type.
const Self = object({ principal_type: string() });

const devin = defineProvider({
  name: "Devin",
  hosts: ["api.devin.ai"],
  auth: {
    apiKey: secrets({
      label: "Service user key or personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.devin.ai/v3/self", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, Self);
  },
});

export default defineApp(
  { user: { accounts: { devin: devin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.devin ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Devin",
        description:
          "Devin (Cognition) v3 API: sessions, knowledge, playbooks, schedules, secrets, users, metrics and enterprise administration.",
        icons,
      },
    ),
  }),
);
