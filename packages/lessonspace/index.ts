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

const lessonspace = defineProvider({
  name: "Lessonspace",
  hosts: ["api.thelessonspace.com"],
  auth: {
    apiKey: secrets({
      label: "Organisation API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.thelessonspace.com/v2/hello/", {
      signal,
      headers: { Authorization: `Organisation ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lessonspace: lessonspace.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lessonspace ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lessonspace",
        description: "Launch Lessonspace virtual classroom spaces and manage sessions, recordings, transcripts and users.",
        icons,
      },
    ),
  }),
);
