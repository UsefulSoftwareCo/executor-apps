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

const harness = defineProvider({
  name: "Harness",
  hosts: ["app.harness.io"],
  auth: {
    apiKey: secrets({
      label: "Personal access token or service account token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.harness.io/ng/api/user/currentUser", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { harness: harness.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.harness ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Harness",
        description: "Harness software delivery platform: pipelines, executions, services, environments, connectors, secrets, feature flags, cloud costs and security tests.",
        icons,
      },
    ),
  }),
);
