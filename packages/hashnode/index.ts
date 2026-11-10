import { accountRouter, decodeJson, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://gql.hashnode.com";

const hashnode = defineProvider({
  name: "Hashnode",
  hosts: ["gql.hashnode.com"],
  auth: {
    // Hashnode only supports Personal Access Tokens; there is no OAuth for third-party apps.
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ me { id } }" }),
    });
    // Since May 2026 every request needs a Pro plan; without one Hashnode answers with a 301 to its
    // announcement page (HTML). decodeJson rejects any non-2xx status before parsing, so that surfaces
    // as a status error carrying the 301 rather than a JSON decode failure.
    // Only `id` is decoded: User.id is ID!, but the nullability of username and name is unverified.
    const { data } = await decodeJson(response, object({ data: object({ me: object({ id: string() }) }) }));
    return { accountInfo: { externalId: data.me.id } };
  },
});

export default defineApp(
  { user: { accounts: { hashnode: hashnode.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hashnode ?? [],
        async (account) =>
          withApprovals(
            // UNVERIFIED against the vendor: apidocs.hashnode.com could not be retrieved. Raw token, no Bearer
            // prefix, matches the Raycast extension; Metorial sends Bearer (see README).
            await graphqlRouter({ url, account, headers: { Authorization: account.fields.token }, cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Hashnode",
        description: "Requires a Hashnode Pro plan. Publications, posts, drafts, series, comments and the rest of Hashnode's GraphQL API.",
        icons,
      },
    ),
  }),
);
