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
import { options } from "./openapi.js";

const checkvist = defineProvider({
  name: "Checkvist",
  hosts: ["checkvist.com"],
  auth: {
    apiKey: secrets({
      label: "Email and Remote API key",
      fields: object({
        email: plain(string({ minLength: 1 })),
        remoteKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const credentials = btoa(`${account.fields.email}:${account.fields.remoteKey}`);
    const response = await fetch("https://checkvist.com/auth/curr_user.json", {
      signal,
      headers: { Authorization: `Basic ${credentials}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { checkvist: checkvist.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.checkvist ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Checkvist",
        description: "Manage Checkvist outlines: lists, tasks, tags, due dates, repeats and notes.",
        icons,
      },
    ),
  }),
);
