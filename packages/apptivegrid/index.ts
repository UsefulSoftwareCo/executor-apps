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

const apptivegrid = defineProvider({
  name: "ApptiveGrid",
  hosts: ["app.apptivegrid.de"],
  auth: {
    apiKey: secrets({
      label: "Access key (key and secret from POST /api/users/{userId}/accessKeys)",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.apptivegrid.de/api/users/me", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.key}:${account.fields.secret}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { apptivegrid: apptivegrid.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apptivegrid ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ApptiveGrid",
        description: "Manage ApptiveGrid spaces, grids, records, views, forms, flows and webhooks.",
        icons,
      },
    ),
  }),
);
