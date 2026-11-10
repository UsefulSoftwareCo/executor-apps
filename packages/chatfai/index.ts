import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  boolean,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.chatfai.com/v1";

const chatfai = defineProvider({
  name: "ChatFAI",
  hosts: ["api.chatfai.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // No current-user endpoint is documented; character search is a documented read-only call that needs a valid token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/characters/search?q=a`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, search: Record<string, unknown> = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

function build(call: ReturnType<typeof client>) {
  return router({
    characters: router(
      {
        search: query(
          {
            description: "Search public characters by name or keyword.",
            input: object({ q: string({ minLength: 1 }) }),
          },
          async (_ctx, input: { q: string }) => call("GET", "/characters/search", { q: input.q }),
        ),
        get: query(
          {
            description: "Retrieve a public character by id (the id returned by characters.search).",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, input: { id: string }) => call("GET", `/characters/${encodeURIComponent(input.id)}`),
        ),
      },
      { title: "Characters", description: "Public ChatFAI characters." },
    ),
    chat: router(
      {
        generateReply: mutation(
          {
            description:
              "Generate a reply from a character to a message. Provide characterId and the user's message content; optional name and bio override the character's.",
            input: object({
              characterId: string({ minLength: 1 }),
              content: string({ minLength: 1 }),
              name: string().optional(),
              bio: string().optional(),
              useInternalOptimizations: boolean().optional(),
            }),
          },
          async (
            _ctx,
            input: { characterId: string; content: string; name?: string; bio?: string; useInternalOptimizations?: boolean },
          ) =>
            call("POST", "/chat", {}, {
              character_id: input.characterId,
              conversation: [{ content: input.content }],
              name: input.name,
              bio: input.bio,
              use_internal_optimizations: input.useInternalOptimizations,
            }),
        ),
      },
      { title: "Chat", description: "Generate in-character replies." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { chatfai: chatfai.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chatfai ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ChatFAI",
        description: "Search and read public ChatFAI characters and generate in-character chat replies.",
        icons,
      },
    ),
  }),
);
