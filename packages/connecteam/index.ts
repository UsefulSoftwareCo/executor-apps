import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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

const Me = object({ data: object({ companyId: string(), companyName: string() }) });

// Every Connecteam scope. The client_credentials token request asks for all of them and Connecteam
// answers 403 "Unauthorized scopes requested" if the OAuth app was created without any one, so the app
// must be created with all scopes selected (scopes cannot be edited afterwards).
const scopes = [
  "account_information.delete",
  "account_information.read",
  "account_information.write",
  "assets.delete",
  "assets.read",
  "assets.write",
  "attachments.delete",
  "attachments.read",
  "attachments.write",
  "celebrations.read",
  "chat.delete",
  "chat.read",
  "chat.write",
  "company_checklist.read",
  "company_checklist.write",
  "company_insights.read",
  "company_policies.delete",
  "company_policies.read",
  "company_policies.write",
  "daily_note.delete",
  "daily_note.read",
  "daily_note.write",
  "documents.read",
  "documents.write",
  "forms.delete",
  "forms.read",
  "forms.write",
  "jobs.delete",
  "jobs.read",
  "jobs.write",
  "nfc.delete",
  "nfc.read",
  "nfc.write",
  "onboarding.delete",
  "onboarding.read",
  "onboarding.write",
  "pay_rates.delete",
  "pay_rates.read",
  "pay_rates.write",
  "publishers.delete",
  "publishers.read",
  "publishers.write",
  "quick_tasks.delete",
  "quick_tasks.read",
  "quick_tasks.write",
  "recognitions.read",
  "sales_data.delete",
  "sales_data.read",
  "sales_data.write",
  "schedule.delete",
  "schedule.read",
  "schedule.write",
  "settings.delete",
  "settings.read",
  "settings.write",
  "time_clock.delete",
  "time_clock.read",
  "time_clock.write",
  "time_off.delete",
  "time_off.read",
  "time_off.write",
  "users.delete",
  "users.read",
  "users.write",
];

const connecteam = defineProvider({
  name: "Connecteam",
  hosts: ["api.connecteam.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.connecteam.com/oauth/v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes,
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      "token" in account.fields
        ? { "X-API-KEY": account.fields.token }
        : { Authorization: `Bearer ${account.fields.access_token}` };
    const response = await fetch("https://api.connecteam.com/me", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.data.companyId, username: me.data.companyName } };
  },
});

export default defineApp(
  { user: { accounts: { connecteam: connecteam.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.connecteam ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Connecteam",
        description:
          "Connecteam workforce management: users, schedulers and shifts, time clock, time off, forms, chat, tasks, jobs and company policies.",
        icons,
      },
    ),
  }),
);
