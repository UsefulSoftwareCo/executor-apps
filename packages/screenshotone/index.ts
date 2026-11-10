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

const screenshotone = defineProvider({
  name: "ScreenshotOne",
  hosts: ["api.screenshotone.com"],
  auth: {
    apiKey: secrets({
      label: "Access key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.screenshotone.com/usage", {
      signal,
      headers: { "X-Access-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`ScreenshotOne rejected the access key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { screenshotone: screenshotone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.screenshotone ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ScreenshotOne",
        description: "Take website screenshots, render HTML, run bulk jobs, list devices and check usage with ScreenshotOne.",
        icons,
      },
    ),
  }),
);
