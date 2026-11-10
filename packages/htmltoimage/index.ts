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

const htmltoimage = defineProvider({
  name: "HTML to Image",
  hosts: ["app.html2img.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /api/me is free and works even with zero credits.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.html2img.com/api/me", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { htmltoimage: htmltoimage.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.htmltoimage ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HTML to Image",
        description: "Render HTML and CSS, public URLs or saved templates into PNG images or PDFs, and check account credits, with html2img.",
        icons,
      },
    ),
  }),
);
