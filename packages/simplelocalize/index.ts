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

const simplelocalize = defineProvider({
  name: "SimpleLocalize",
  hosts: ["api.simplelocalize.io"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    personalToken: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const personal = account.method === "personalToken";
    const response = await fetch(
      personal
        ? "https://api.simplelocalize.io/api/v2/projects"
        : "https://api.simplelocalize.io/api/v2/project",
      {
        signal,
        headers: personal
          ? { Authorization: account.fields.token }
          : { "X-SimpleLocalize-Token": account.fields.token },
      },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { simplelocalize: simplelocalize.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simplelocalize ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SimpleLocalize",
        description:
          "Manage SimpleLocalize translation projects: translation keys, translations, languages, imports, exports, environments, jobs and auto-translation.",
        icons,
      },
    ),
  }),
);
