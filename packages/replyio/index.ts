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

const replyio = defineProvider({
  name: "Reply.io",
  hosts: ["api.reply.io"],
  auth: {
    apiKey: secrets({
      label: "API key (user, team or organization)",
      // Leave the three acting-user fields empty for a user key. A team key may name a user;
      // an organization key must name one with userId, or with userEmail and teamId.
      fields: object({
        token: string({ minLength: 1 }),
        userId: string(),
        userEmail: string(),
        teamId: string(),
      }),
    }),
  },
  // Reply documents GET /v3/whoami as the credential check that needs no scope. Organization keys
  // are rejected with 403 USER_REQUIRED unless they also name the acting user.
  async health({ account, fetch, signal }) {
    const { token, userId, userEmail, teamId } = account.fields;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (userId !== "") headers["X-User-Id"] = userId;
    else if (userEmail !== "") {
      headers["X-User-Email"] = userEmail;
      if (teamId !== "") headers["X-Team-Id"] = teamId;
    }
    const response = await fetch("https://api.reply.io/v3/whoami", { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { replyio: replyio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.replyio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Reply.io",
        description: "Run sales outreach with Reply.io: contacts, accounts, sequences, inbox, email accounts, templates, reports and AI SDR.",
        icons,
      },
    ),
  }),
);
