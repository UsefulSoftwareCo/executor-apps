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

const penpot = defineProvider({
  name: "Penpot",
  hosts: ["design.penpot.app"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://design.penpot.app/api/main/methods/get-profile", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Token ${account.fields.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    await decodeJson(response, object({ id: string(), email: string() }));
  },
});

export default defineApp(
  { user: { accounts: { penpot: penpot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.penpot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Penpot",
        description: "Design with Penpot: teams, projects, files, pages, comments, libraries, fonts and exports.",
        icons,
      },
    ),
  }),
);
