import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const circleso = defineProvider({
  name: "Circle",
  hosts: ["app.circle.so"],
  auth: {
    apiKey: secrets({
      label: "Admin API v2 token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.circle.so/api/admin/v2/community", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({ id: number() }));
  },
});

export default defineApp(
  { user: { accounts: { circleso: circleso.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.circleso ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Circle",
        description: "Manage a Circle community: members, spaces, posts, events, courses, access groups, tags, comments and more.",
        icons,
      },
    ),
  }),
);
