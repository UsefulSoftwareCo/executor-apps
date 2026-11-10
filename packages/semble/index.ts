import { accountRouter, decodeJson, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://open.semble.io/graphql";

const semble = defineProvider({
  name: "Semble",
  hosts: ["open.semble.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Semble has no current-user query; an authenticated __typename rejects invalid or expired tokens.
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "x-token": account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
    return { accountInfo: { externalId: "semble", displayName: "Semble" } };
  },
});

export default defineApp(
  { user: { accounts: { semble: semble.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.semble ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: { "x-token": account.fields.token }, cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Semble",
        description: "Patients, bookings, availability and the rest of Semble's practice management GraphQL API.",
        icons,
      },
    ),
  }),
);
