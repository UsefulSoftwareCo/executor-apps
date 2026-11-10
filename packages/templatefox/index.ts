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

const templatefox = defineProvider({
  name: "TemplateFox",
  hosts: ["api.templatefox.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.templatefox.com/v1/account", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ credits: number() }));
  },
});

export default defineApp(
  { user: { accounts: { templatefox: templatefox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.templatefox ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TemplateFox",
        description: "Generate PDFs and images from HTML/CSS templates, manage templates and versions, manipulate PDFs, and configure S3 storage with TemplateFox.",
        icons,
      },
    ),
  }),
);
