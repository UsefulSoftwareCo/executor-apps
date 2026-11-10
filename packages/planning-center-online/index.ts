import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { allOptions } from "./openapi.js";

const Me = object({ data: object({ id: string() }) });

const planningCenter = defineProvider({
  name: "Planning Center",
  hosts: ["api.planningcenteronline.com"],
  auth: {
    personalAccessToken: secrets({
      label: "Personal access token",
      fields: object({
        appId: plain(string({ minLength: 1 })),
        secret: string({ minLength: 1 }),
      }),
    }),
    // Planning Center publishes OIDC metadata but no client registration: the connect page asks for the
    // client of an OAuth application registered at api.planningcenteronline.com/oauth/applications.
    oauth: oauth2({
      discover: "https://api.planningcenteronline.com",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "people",
        "services",
        "giving",
        "calendar",
        "check_ins",
        "groups",
        "publishing",
        "registrations",
      ],
    }),
  },
  // /current/v2/me needs no product scope, for either credential.
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : {
            Authorization: `Basic ${btoa(`${account.fields.appId}:${account.fields.secret}`)}`,
          };
    const response = await fetch("https://api.planningcenteronline.com/current/v2/me", { signal, headers });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.data.id } };
  },
});

export default defineApp(
  { user: { accounts: { planningCenter: planningCenter.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.planningCenter ?? [],
        (account) => {
          const mount = (options: (typeof allOptions)[keyof typeof allOptions]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              people: mount(allOptions.people),
              services: mount(allOptions.services),
              giving: mount(allOptions.giving),
              calendar: mount(allOptions.calendar),
              checkIns: mount(allOptions.checkIns),
              groups: mount(allOptions.groups),
              publishing: mount(allOptions.publishing),
              registrations: mount(allOptions.registrations),
              webhooks: mount(allOptions.webhooks),
            },
            { title: "Planning Center", description: "Planning Center account." },
          );
        },
        { signal },
      ),
      {
        title: "Planning Center",
        description:
          "Planning Center. people: members, households, lists, forms, workflows. services: plans, songs, teams, schedules. giving: donations, funds, batches. calendar: events, resources, rooms. checkIns: events, check-ins, locations. groups: groups, memberships, events. publishing: episodes, series, channels. registrations: signups and attendees. webhooks: subscriptions.",
        icons,
      },
    ),
  }),
);
