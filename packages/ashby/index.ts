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

const ashby = defineProvider({
  name: "Ashby",
  hosts: ["api.ashbyhq.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Requires the apiKeysRead permission on the key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ashbyhq.com/apiKey.info", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.token}:`)}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ashby: ashby.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ashby ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ashby",
        description: "Recruiting and applicant tracking with Ashby: candidates, applications, jobs, interviews, offers, openings and reports.",
        icons,
      },
    ),
  }),
);
