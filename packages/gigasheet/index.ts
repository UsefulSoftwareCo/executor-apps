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

const gigasheet = defineProvider({
  name: "Gigasheet",
  hosts: ["api.gigasheet.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gigasheet.com/user/whoami", {
      signal,
      headers: { "X-GIGASHEET-TOKEN": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { gigasheet: gigasheet.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gigasheet ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gigasheet",
        description: "Analyze big data in Gigasheet: upload files, browse and filter sheets, group, enrich, export and share datasets.",
        icons,
      },
    ),
  }),
);
