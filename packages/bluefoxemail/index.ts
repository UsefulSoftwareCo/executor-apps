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

const bluefox = defineProvider({
  name: "BlueFox Email",
  hosts: ["api.bluefox.email"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({ token: string({ minLength: 1 }), projectId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.bluefox.email/v1/projectId/${encodeURIComponent(account.fields.projectId)}`,
      { signal, headers: { Authorization: `Bearer ${account.fields.token}` } },
    );
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.projectId } };
  },
});

export default defineApp(
  { user: { accounts: { bluefoxemail: bluefox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bluefoxemail ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // GET test-webhook fires a synthetic event at the project's webhook URL: an external side effect.
            tool.kind === "mutation" || name.endsWith("getProjectIdTestWebhook")
              ? always()
              : undefined,
          ),
        { signal },
      ),
      {
        title: "BlueFox Email",
        description: "Transactional and triggered email, campaigns, contacts, subscriber lists, segments, domains and sender identities in BlueFox Email.",
        icons,
        instructions:
          "Most endpoints take a projectId path parameter: the project ID from BlueFox Project Settings, the same one saved with the account.",
      },
    ),
  }),
);
