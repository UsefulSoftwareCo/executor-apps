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

const adafruitio = defineProvider({
  name: "Adafruit IO",
  hosts: ["io.adafruit.com"],
  auth: {
    apiKey: secrets({
      label: "AIO key",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://io.adafruit.com/api/v2/user", {
      signal,
      headers: { "X-AIO-Key": account.fields.key },
    });
    await decodeJson(response, object({ username: string() }));
  },
});

export default defineApp(
  { user: { accounts: { adafruitio: adafruitio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.adafruitio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Adafruit IO",
        description: "Adafruit IO: IoT feeds, data, groups, dashboards, blocks, triggers, tokens and webhooks.",
        icons,
      },
    ),
  }),
);
