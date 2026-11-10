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

const flotiq = defineProvider({
  name: "Flotiq",
  hosts: ["api.flotiq.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.flotiq.com/api/auth-context", {
      signal,
      headers: { "X-AUTH-TOKEN": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { flotiq: flotiq.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.flotiq ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Flotiq",
        description:
          "Headless CMS: content type definitions, content objects of any type (including media and tags), batch writes, versions, search and GraphQL.",
        instructions:
          "Content object tools take a contentType path argument: the name of a content type definition such as _media, _tag or one you defined. List content types first with getContentDefinitions.",
        icons,
      },
    ),
  }),
);
