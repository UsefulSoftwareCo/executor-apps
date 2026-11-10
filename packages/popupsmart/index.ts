import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://app.popupsmart.com/api/leads";

const popupsmart = defineProvider({
  name: "Popupsmart",
  hosts: ["app.popupsmart.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Every endpoint also needs a campaign id, which is a per-call input here, so the key alone cannot be
  // fully checked. Request one lead for a placeholder campaign; only a 401 means the key itself is bad.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}?take=1`, {
      signal,
      headers: { "x-token": account.fields.token, "x-campaign-id": "health-check" },
    });
    if (response.status === 401) throw new Error("Popupsmart rejected the API key (401)");
  },
});

type Fetch = typeof fetch;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return router({
    listLeads: query(
      {
        description:
          "List the leads collected by one Popupsmart campaign. campaignId is the campaign's ID from the Popupsmart dashboard. Each lead has formData (the submitted fields), meta (UTM parameters) and triggerIntegrations. Optional filters, pass an empty string to omit: startDate and endDate as YYYY-MM-DD (the vendor defaults to the last 1 day and allows at most 90 days); take is the page size as a number string (default 50); skip is the number of leads to skip (default 0). Page by increasing skip by take.",
        input: object({
          campaignId: string({ minLength: 1 }),
          startDate: string(),
          endDate: string(),
          take: string(),
          skip: string(),
        }),
      },
      async (_ctx, { campaignId, startDate, endDate, take, skip }) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries({ startDate, endDate, take, skip })) {
          if (value !== "") params.set(key, value);
        }
        const qs = params.toString();
        const response = await fetcher(qs === "" ? base : `${base}?${qs}`, {
          signal,
          headers: { "x-token": token, "x-campaign-id": campaignId },
        });
        return decodeJson(response, json());
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { popupsmart: popupsmart.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.popupsmart ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Popupsmart",
        description: "Export the leads collected by a Popupsmart popup campaign.",
        icons,
      },
    ),
  }),
);
