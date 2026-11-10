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

const runway = defineProvider({
  name: "Runway",
  hosts: ["api.dev.runwayml.com"],
  auth: {
    apiKey: secrets({
      label: "API secret",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.dev.runwayml.com/v1/organization", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "X-Runway-Version": "2024-11-06" },
    });
    await decodeJson(response, object({ creditBalance: number() }));
  },
});

export default defineApp(
  { user: { accounts: { runway: runway.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.runway ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account, parameterDefaults: { headers: { "X-Runway-Version": "2024-11-06" } } }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Runway",
        description: "Generate video, images and audio with Runway: text, image and video generation, tasks, uploads, avatars, documents and organization usage.",
        icons,
      },
    ),
  }),
);
