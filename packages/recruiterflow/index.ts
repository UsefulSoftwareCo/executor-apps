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

const recruiterflow = defineProvider({
  name: "Recruiterflow",
  hosts: ["api.recruiterflow.com"],
  auth: {
    // Recruiterflow > Company Settings > API: the key goes in the RF-Api-Key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.recruiterflow.com/api/external/user/list", {
      signal,
      headers: { "RF-Api-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { recruiterflow: recruiterflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.recruiterflow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Recruiterflow",
        description: "Recruiting CRM and ATS: candidates, jobs, clients, contacts, pipelines, activities, notes and users.",
        icons,
      },
    ),
  }),
);
