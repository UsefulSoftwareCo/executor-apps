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
import { machinesOptions, spritesOptions } from "./openapi.js";

const fly = defineProvider({
  name: "Fly",
  hosts: ["api.machines.dev", "api.sprites.dev"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Sprites tokens are issued separately (sprites.dev/account, `sprite org auth`); Fly's docs do not say
    // that a Fly API token is accepted by api.sprites.dev.
    spritesToken: secrets({
      label: "Sprites API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const headers = { Authorization: `Bearer ${account.fields.token}` };
    if (account.method === "spritesToken") {
      // Authenticated (bearerAuth); `name` is the organization slug and is always present.
      const response = await fetch("https://api.sprites.dev/v1/sprites?max_results=1", { signal, headers });
      const body = await decodeJson(response, object({ name: string() }));
      return { accountInfo: { externalId: body.name, displayName: body.name } };
    }
    // CurrentToken_show is authenticated (unlike /platform/regions, which is public): 401 on a bad token.
    const response = await fetch("https://api.machines.dev/v1/tokens/current", { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { fly: fly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fly ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return account.method === "spritesToken"
            ? router({ sprites: approve(liveOpenapiRouter({ ...spritesOptions, cache, fetch, signal, account })) })
            : router({ machines: approve(liveOpenapiRouter({ ...machinesOptions, cache, fetch, signal, account })) });
        },
        { signal },
      ),
      {
        title: "Fly",
        description:
          "Fly.io. machines (Fly API token): apps, Machines, volumes, secrets, certificates, IP addresses, Postgres clusters. sprites (Sprites API token): Sprites, exec, filesystem, checkpoints, services, network and resource policy.",
        icons,
      },
    ),
  }),
);
