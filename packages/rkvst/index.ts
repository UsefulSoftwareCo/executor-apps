import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { specs } from "./openapi.js";

const rkvst = defineProvider({
  name: "DataTrails (RKVST)",
  hosts: ["app.datatrails.ai"],
  auth: {
    appRegistration: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://app.datatrails.ai/archivist/iam/v1/appidp/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
  },
  // The app registration must be granted access by an access policy; an empty list is still a 200.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.datatrails.ai/archivist/v2/assets?page_size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { rkvst: rkvst.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rkvst ?? [],
        (account) => {
          const mount = (options: (typeof specs)[keyof typeof specs]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(specs).map(([key, options]) => [key, mount(options)])) as Record<
              keyof typeof specs,
              ReturnType<typeof mount>
            >,
            { title: "DataTrails", description: "DataTrails tenancy." },
          );
        },
        { signal },
      ),
      {
        title: "DataTrails (RKVST)",
        description:
          "DataTrails (formerly RKVST) provenance: assets and events, attachments and blobs, locations, access policies, subjects, members, app registrations, compliance policies, SCITT statements and tenancy settings.",
        icons,
      },
    ),
  }),
);
