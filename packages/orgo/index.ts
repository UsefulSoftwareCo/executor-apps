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

const orgo = defineProvider({
  name: "Orgo",
  hosts: ["www.orgo.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://www.orgo.ai/api/account/capacity", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { orgo: orgo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.orgo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // listWorkspaces is a GET that creates a first workspace for an account-wide key.
            tool.kind === "mutation" || name.split(".").pop() === "listWorkspaces" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Orgo",
        description:
          "Cloud computers for AI agents: create and manage computers and workspaces, take screenshots, click, type, run shell commands, transfer files and run templates.",
        icons,
      },
    ),
  }),
);
