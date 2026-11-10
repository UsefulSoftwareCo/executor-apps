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

const conversiontools = defineProvider({
  name: "Conversion Tools",
  hosts: ["api.conversiontools.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /auth returns the account email and does not count against quota.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.conversiontools.io/v1/auth", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { conversiontools: conversiontools.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.conversiontools ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Conversion Tools",
        description: "Convert files between 100+ formats with Conversion Tools: upload files, create conversion tasks, check status and download results.",
        icons,
      },
    ),
  }),
);
