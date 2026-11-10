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

const segment = defineProvider({
  name: "Segment",
  hosts: ["api.segmentapis.com"],
  auth: {
    apiKey: secrets({
      label: "Public API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.segmentapis.com/", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ workspace: object({ id: string(), name: string(), slug: string() }) }) }),
    );
    return { accountInfo: { externalId: data.workspace.id, displayName: data.workspace.name } };
  },
});

export default defineApp(
  { user: { accounts: { segment: segment.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.segment ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Segment",
        description:
          "Manage a Twilio Segment workspace: sources, destinations, warehouses, tracking plans, functions, transformations, audiences, users and delivery metrics.",
        icons,
      },
    ),
  }),
);
