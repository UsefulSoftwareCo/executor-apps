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

const uploadcare = defineProvider({
  name: "Uploadcare",
  hosts: ["api.uploadcare.com"],
  auth: {
    apiKey: secrets({
      label: "Public and secret key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.uploadcare.com/project/", {
      signal,
      headers: {
        Authorization: `Uploadcare.Simple ${account.fields.token}`,
        Accept: "application/vnd.uploadcare-v0.7+json",
      },
    });
    await decodeJson(response, object({ pub_key: string() }));
  },
});

export default defineApp(
  { user: { accounts: { uploadcare: uploadcare.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.uploadcare ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Uploadcare",
        description: "Manage Uploadcare files, groups, webhooks, document and video conversions, and project info.",
        icons,
        instructions:
          "Every tool requires the accept header input: pass headers.accept = \"application/vnd.uploadcare-v0.7+json\".",
      },
    ),
  }),
);
