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

const prisma = defineProvider({
  name: "Prisma",
  hosts: ["api.prisma.io"],
  auth: {
    apiKey: secrets({
      label: "Service token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      discover: "https://auth.prisma.io",
      scopes: ["workspace:admin", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.prisma.io/v1/workspaces", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { prisma: prisma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.prisma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Prisma",
        description:
          "Prisma Data Platform Management API: Prisma Postgres projects, databases, connections, backups, usage, apps, services and workspaces.",
        icons,
      },
    ),
  }),
);
