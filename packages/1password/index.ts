import { accountRouter, decodeJson, defineApp, json, number, object, ProviderError, query, router, string } from "apps";
import { icons } from "./icon.js";
import { onepassword } from "./provider.ts";
import { host } from "./region.ts";

type Fields = { token: string; region: string };

const cursorInput = object({
  cursor: string().optional(),
  limit: number().optional(),
  startTime: string().optional(),
  endTime: string().optional(),
});

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  // Resolve the host when a tool runs, so an account with an unknown region fails its own calls
  // with that message instead of failing to load every tool.
  const url = (path: string) => `https://${host(fields.region)}${path}`;
  const headers = { Authorization: `Bearer ${fields.token}`, "content-type": "application/json" };
  // 1Password answers a token it does not accept, such as a service account token, with 401.
  const send = async (path: string, init: RequestInit) => {
    const response = await fetcher(url(path), { ...init, signal, headers });
    if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
    return decodeJson(response, json());
  };
  const get = (path: string) => send(path, {});
  // To continue, pass only the cursor from the previous response. To start (or restart), pass limit/startTime/endTime.
  const page = (path: string) => async (_ctx: unknown, input: { cursor?: string; limit?: number; startTime?: string; endTime?: string }) => {
    const body = input.cursor
      ? { cursor: input.cursor }
      : {
          ...(input.limit !== undefined ? { limit: input.limit } : {}),
          ...(input.startTime ? { start_time: input.startTime } : {}),
          ...(input.endTime ? { end_time: input.endTime } : {}),
        };
    return send(path, { method: "POST", body: JSON.stringify(body) });
  };
  const cursorNote =
    " Pass cursor (from the previous response) to continue, or limit (1-1000), startTime and endTime (RFC 3339) to start a new cursor. Repeat while has_more is true.";

  return router({
    introspect: query(
      { description: "Show the token's UUID, issue time and the event features (auditevents, itemusages, signinattempts) it may read.", input: object({}) },
      async () => get("/api/v2/auth/introspect"),
    ),
    auditEvents: query(
      { description: "Audit events for actions by team members (requires the auditevents feature)." + cursorNote, input: cursorInput },
      page("/api/v2/auditevents"),
    ),
    signInAttempts: query(
      { description: "Successful and failed attempts to sign in to the account (requires the signinattempts feature)." + cursorNote, input: cursorInput },
      page("/api/v2/signinattempts"),
    ),
    itemUsages: query(
      { description: "Usages of items stored in shared vaults (requires the itemusages feature)." + cursorNote, input: cursorInput },
      page("/api/v2/itemusages"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { onepassword: onepassword.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.onepassword ?? [], (account) => build(account.fields, fetch, signal), { signal }),
      {
        title: "1Password",
        description: "Read 1Password Events API data: audit events, sign-in attempts and shared-vault item usages.",
        icons,
      },
    ),
  }),
);
