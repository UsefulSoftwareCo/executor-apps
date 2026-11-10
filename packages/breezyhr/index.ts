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

const breezyhr = defineProvider({
  name: "Breezy HR",
  hosts: ["api.breezy.hr"],
  auth: {
    // A personal access token (breezy_pat_...) or a session token from POST /v3/signin.
    // Both are sent bare in the Authorization header.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.breezy.hr/v3/user", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    // Breezy documents no always-present fields on the User object, so decode none and rely on the
    // 2xx status (a bad token is a 401) plus a JSON body to prove the token works.
    await decodeJson(response, object({}));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { breezyhr: breezyhr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.breezyhr ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Breezy HR",
        description: "Recruiting and applicant tracking with Breezy HR: companies, positions, candidates, pipelines, questionnaires and webhooks.",
        icons,
      },
    ),
  }),
);
