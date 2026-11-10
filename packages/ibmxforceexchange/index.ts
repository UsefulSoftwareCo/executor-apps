import {
  accountRouter,
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

const xforce = defineProvider({
  name: "IBM X-Force Exchange",
  hosts: ["api.xforce.ibmcloud.com"],
  auth: {
    apiKey: secrets({
      label: "API key and password (Exchange > Settings > API Access)",
      fields: object({ key: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  // /user/profile is authenticated (401 without valid credentials; /ipr/categories answers 200 to anyone). Only 401 means bad credentials; tiers without access to a given report answer 402/403.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.xforce.ibmcloud.com/user/profile", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.key}:${account.fields.password}`)}` },
    });
    if (response.status === 401) throw new Error("IBM X-Force Exchange rejected the API key or password (401)");
    if (response.status >= 500) throw new Error(`IBM X-Force Exchange health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { xforce: xforce.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.xforce ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "IBM X-Force Exchange",
        description:
          "Threat intelligence from IBM X-Force Exchange: IP, URL and malware reports, vulnerabilities, threat groups, casefiles and TAXII feeds.",
        icons,
      },
    ),
  }),
);
