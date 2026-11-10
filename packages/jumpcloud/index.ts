import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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
import { v1Options, v2Options } from "./openapi.js";

const consoles: Record<string, string> = {
  us: "https://console.jumpcloud.com",
  eu: "https://console.eu.jumpcloud.com",
  in: "https://console.in.jumpcloud.com",
};

function origin(account: { fields: { region: string } }) {
  const base = consoles[account.fields.region.trim().toLowerCase()];
  if (!base) throw new Error("Enter your JumpCloud region: us, eu or in.");
  return base;
}

const jumpcloud = defineProvider({
  name: "JumpCloud",
  hosts: ["console.jumpcloud.com", "console.eu.jumpcloud.com", "console.in.jumpcloud.com"],
  auth: {
    apiKey: secrets({
      label: "Region and API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/api/organizations`, {
      signal,
      headers: { "x-api-key": account.fields.apiKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { jumpcloud: jumpcloud.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jumpcloud ?? [],
        (account) => {
          const base = origin(account);
          const mount = (options: typeof v1Options | typeof v2Options, path: string) =>
            withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: `${base}${path}`, cache, fetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            { v1: mount(v1Options, "/api"), v2: mount(v2Options, "/api/v2") },
            { title: "JumpCloud", description: "JumpCloud account." },
          );
        },
        { signal },
      ),
      {
        title: "JumpCloud",
        description:
          "JumpCloud directory platform. v1: systems, system users, commands, applications, organizations, search. v2: user and system groups, policies, directories, LDAP/SCIM/Active Directory, MDM, access requests, integrations.",
        icons,
      },
    ),
  }),
);
