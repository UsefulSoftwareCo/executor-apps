import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Each data center has its own API host (https://www.gptbots.ai/docs/api-reference/overview).
const regions: Record<string, string> = {
  sg: "api-sg.gptbots.ai",
  jp: "api-jp.gptbots.ai",
  th: "api-th.gptbots.ai",
};

function regionHost(region: string): string {
  const host = regions[region.trim().toLowerCase()];
  if (!host) throw new Error("Region must be sg, jp or th: the data center your GPTBots organization was created in.");
  return host;
}

// GPTBots reports some failures as HTTP 200 with a non-zero code and message.
function assertSuccess(parsed: unknown): void {
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "code" in parsed &&
    typeof parsed.code === "number" &&
    parsed.code !== 0
  ) {
    throw new Error(`GPTBots error ${parsed.code}: ${"message" in parsed ? String(parsed.message) : ""}`);
  }
}

const gptbots = defineProvider({
  name: "GPTBots",
  hosts: Object.values(regions),
  auth: {
    apiKey: secrets({
      label: "Agent API key and region",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Listing the knowledge bases of the key's agent is a free read that fails with 401 on a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://${regionHost(account.fields.region)}/v1/bot/knowledge/base/page`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(
      response,
      object({
        code: number().optional(),
        message: string().optional(),
        knowledge_base: array(json()).optional(),
      }),
    );
    assertSuccess(body);
    if (body.knowledge_base === undefined) throw new Error("GPTBots health response had no knowledge_base list");
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;
type Fields = { region: string; token: string };

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`https://${regionHost(fields.region)}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${fields.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`GPTBots ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { ok: true };
    try {
      const parsed = JSON.parse(text) as unknown;
      assertSuccess(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) return { value: text };
      throw error;
    }
  };
}

type Call = ReturnType<typeof client>;

const id = string({ minLength: 1 });
const ms = number();

function build(call: Call) {
  return router({
    conversations: router(
      {
        create: mutation(
          {
            description:
              "Create a conversation for a user of the API key's agent. user_id is your own identifier (max 32 characters); anonymous_id is generated when omitted. Returns conversation_id.",
            input: object({ user_id: id, anonymous_id: string().optional() }),
          },
          async (_c, input) => call("POST", "/v1/conversation", {}, input),
        ),
        sendMessage: mutation(
          {
            description:
              "Send a user message to a conversation and wait for the agent's complete reply (blocking mode). Consumes credits and stores a permanent message; after a timeout, list the conversation messages before retrying. conversation_config overrides per conversation: short_term_memory, long_term_memory (booleans), knowledge ({ group_ids, data_ids }) and custom_variables (object).",
            input: object({
              conversation_id: id,
              text: string({ minLength: 1 }),
              conversation_config: record(json()).optional(),
            }),
          },
          async (_c, input) =>
            call(
              "POST",
              "/v2/conversation/message",
              {},
              {
                conversation_id: input.conversation_id,
                response_mode: "blocking",
                messages: [{ role: "user", content: [{ type: "text", text: input.text }] }],
                ...(input.conversation_config === undefined ? {} : { conversation_config: input.conversation_config }),
              },
            ),
        ),
        list: query(
          {
            description:
              "List conversations of the agent in a time window. conversation_type is ALL, API, EMBED or another source type; start_time and end_time are millisecond timestamps; page starts at 1; page_size is 10 to 100.",
            input: object({
              conversation_type: string({ minLength: 1 }),
              start_time: ms,
              end_time: ms,
              page: number(),
              page_size: number(),
              user_id: string().optional(),
            }),
          },
          async (_c, input) => call("GET", "/v1/bot/conversation/page", input),
        ),
        messages: query(
          {
            description: "List the messages of one conversation, newest page by page. page starts at 1; page_size is at most 100.",
            input: object({ conversation_id: id, page: number(), page_size: number() }),
          },
          async (_c, input) => call("GET", "/v2/messages", input),
        ),
        referencedKnowledge: query(
          {
            description: "Get the knowledge chunks an agent reply cited. message_id is the agent's response message ID.",
            input: object({ message_id: id }),
          },
          async (_c, input) => call("GET", "/v1/correlate/dataset", input),
        ),
        suggestedQuestions: query(
          {
            description: "Generate follow-up questions for an agent reply. answer_id is the agent's response message ID.",
            input: object({ answer_id: id }),
          },
          async (_c, input) => call("GET", "/v1/next/question", input),
        ),
        getProperties: query(
          {
            description: "Read every conversation property defined on the agent, with this conversation's values (always strings).",
            input: object({ conversation_id: id }),
          },
          async (_c, input) => call("GET", "/v1/conversation/property", input),
        ),
        updateProperties: mutation(
          {
            description:
              "Set conversation properties. Each item is { name, value } with value as a string (BOOLEAN \"true\"/\"false\", DATETIME epoch milliseconds). Unknown names are ignored; other properties stay unchanged.",
            input: object({
              conversation_id: id,
              properties: array(object({ name: id, value: string().optional() })),
            }),
          },
          async (_c, input) => call("POST", "/v1/conversation/property/update", {}, input),
        ),
        feedback: mutation(
          {
            description: "Rate an agent reply. feedback is POSITIVE, NEGATIVE or CANCELED (removes the rating).",
            input: object({ answer_id: id, feedback: string({ minLength: 1 }) }),
          },
          async (_c, input) => call("POST", "/v1/message/feedback", {}, input),
        ),
      },
      { title: "Conversations", description: "Chat with the agent and inspect its conversations, messages and properties." },
    ),
    knowledge: router(
      {
        listBases: query(
          { description: "List the knowledge bases attached to the API key's agent.", input: object({}) },
          async () => call("GET", "/v1/bot/knowledge/base/page"),
        ),
        createBase: mutation(
          {
            description: "Create a knowledge base. Returns knowledge_base_id.",
            input: object({
              name: id,
              desc: string(),
              graph_enable: boolean().optional(),
              access_control_enabled: boolean().optional(),
            }),
          },
          async (_c, input) => call("POST", "/v1/bot/knowledge/base/create", {}, input),
        ),
        listDocuments: query(
          {
            description: "List the documents of a knowledge base. page starts at 1; page_size is 10 to 100.",
            input: object({ knowledge_base_id: id, page: number(), page_size: number() }),
          },
          async (_c, input) => call("GET", "/v1/bot/doc/query/page", input),
        ),
        documentStatus: query(
          { description: "Check the processing status of documents by ID.", input: object({ data_ids: array(id) }) },
          async (_c, input) => call("GET", "/v1/bot/data/detail/list", input),
        ),
        deleteDocuments: mutation(
          { description: "Delete documents by ID.", input: object({ doc_ids: array(id) }) },
          async (_c, input) => call("DELETE", "/v1/bot/doc/batch/delete", { doc: input.doc_ids.join(",") }),
        ),
        addQaDocument: mutation(
          {
            description:
              "Create a Q&A document from text (purpose QA_TEXT with name and qaList [{ question, answer }]). knowledge_base_id defaults to the agent's default base. Returns the added doc IDs.",
            input: object({
              purpose: string({ minLength: 1 }),
              knowledge_base_id: string().optional(),
              name: string().optional(),
              qaList: array(object({ question: string(), answer: string() })).optional(),
              files: array(record(json())).optional(),
            }),
          },
          async (_c, input) => call("POST", "/v1/bot/doc/qa/add", {}, input),
        ),
        addTextChunks: mutation(
          {
            description: "Append chunks to a text document. Each chunk has content (max 1000 tokens) and optional keywords.",
            input: object({
              doc_id: id,
              chunks: array(object({ content: id, keywords: array(string()).optional() })),
            }),
          },
          async (_c, input) => call("POST", "/v1/bot/doc/chunks/add", {}, input),
        ),
        addTextDocuments: mutation(
          {
            description:
              "Add text documents (pdf/txt/md/doc/docx, up to 20 per call) to a knowledge base from a file_url the service fetches or inline file_base64 (base64 wins when both are given). Each file needs file_name (1-200 chars) and may carry source_url. Supply chunk_token (1-1000) or splitter, otherwise the document later fails with FAIL_STORE. Returns doc [{ doc_id, doc_name }] and failed names; check documentStatus for embedding progress.",
            input: object({
              files: array(
                object({
                  file_name: id,
                  file_url: string().optional(),
                  file_base64: string().optional(),
                  source_url: string().optional(),
                }),
              ),
              knowledge_base_id: string().optional(),
              embedding_model_version_id: string().optional(),
              chunk_token: number().optional(),
              splitter: string().optional(),
            }),
          },
          async (_c, input) => call("POST", "/v1/bot/doc/text/add", {}, input),
        ),
        updateQaDocument: mutation(
          {
            description:
              "Replace the Q&A pairs of a Q&A document. qaList overwrites every existing pair, so send the full set. Needs doc_id.",
            input: object({
              doc_id: id,
              qaList: array(object({ question: string(), answer: string() })),
              knowledge_base_id: string().optional(),
            }),
          },
          async (_c, input) => call("PUT", "/v1/bot/doc/qa/update", {}, input),
        ),
        reembedFailedDocuments: mutation(
          {
            description:
              "Re-vectorize every document in Failed status under the API key's agent. Returns affectCount. Consumes embedding credits.",
            input: object({}),
          },
          async () => call("POST", "/v1/bot/data/retry/batch", {}, {}),
        ),
        getDocumentMetadata: query(
          {
            description:
              "Read custom and automatic metadata of up to 50 documents (comma-separated doc_ids). Fails entirely if any ID is not the agent's. Documents without metadata are omitted.",
            input: object({ doc_ids: array(id) }),
          },
          async (_c, input) => call("GET", "/v1/bot/doc/metadata/detail", { doc_ids: input.doc_ids.join(",") }),
        ),
        updateDocumentMetadata: mutation(
          {
            description:
              "Set metadata on up to 50 documents. Each item is { doc_id, metadata } with metadata a map of field name to value; omitted fields stay, an empty string clears a value, LIST fields accept only their options. Returns per-document results.",
            input: object({ documents: array(object({ doc_id: id, metadata: record(json()).optional() })) }),
          },
          async (_c, input) => call("PUT", "/v1/bot/doc/metadata/update", {}, input),
        ),
        search: query(
          {
            description:
              "Vector similarity search over knowledge. top_k is 1 to 50; embedding_rate 0 is keyword only, 1 semantic only; group_ids / data_ids scope the search to knowledge bases or documents.",
            input: object({
              prompt: id,
              top_k: number(),
              embedding_rate: number().optional(),
              group_ids: array(string()).optional(),
              data_ids: array(string()).optional(),
              doc_correlation: number().optional(),
            }),
          },
          async (_c, input) => call("POST", "/v1/vector/match", {}, input),
        ),
        listMetadataFields: query(
          { description: "List custom document metadata fields, global and per knowledge base.", input: object({}) },
          async () => call("GET", "/v1/bot/doc/metadata/field/list"),
        ),
      },
      { title: "Knowledge", description: "Knowledge bases, documents, chunks and similarity search." },
    ),
    database: router(
      {
        listTables: query(
          { description: "List the database tables of an agent or workflow.", input: object({ agent_id: id }) },
          async (_c, input) => call("POST", "/v1/database/tables/page", {}, input),
        ),
        getRecords: query(
          {
            description:
              "Read rows of a table. page starts at 1, page_size 1 to 100. filter must use the table's single unique field; keyword is a fuzzy search.",
            input: object({
              table_id: id,
              page: number(),
              page_size: number(),
              filter: record(json()).optional(),
              keyword: string().optional(),
            }),
          },
          async (_c, input) => call("POST", "/v1/database/records/page", {}, input),
        ),
        addRecords: mutation(
          {
            description:
              "Import up to 1000 rows (objects of field to value) into a table. Every unique field must be present and unique, otherwise the whole import is discarded. Returns a task ID; pass it to importStatus to follow progress.",
            input: object({ table_id: id, records: array(record(json())) }),
          },
          async (_c, input) => call("POST", "/v1/database/import/records", {}, input),
        ),
        importStatus: query(
          {
            description:
              "Check the progress of table imports by task ID (the ID returned by addRecords). Returns one entry per task with progress, status (FAIL, PENDING_PARSE, AVAILABLE), total_count, success_count, fail_count and fail_detail.",
            input: object({ ids: array(id) }),
          },
          async (_c, input) => call("GET", "/v1/database/query/import-results", input),
        ),
      },
      { title: "Database", description: "Agent database tables and rows." },
    ),
    users: router(
      {
        queryAttributes: query(
          {
            description: "Read user attributes by user_ids or anonymous_ids (give exactly one list, up to 100 IDs).",
            input: object({ user_ids: array(string()).optional(), anonymous_ids: array(string()).optional() }),
          },
          async (_c, input) => call("GET", "/v2/user-property/query", input),
        ),
        updateAttributes: mutation(
          {
            description: "Set attributes of a user. property_values is a list of { property_name, value }.",
            input: object({ user_id: id, property_values: array(object({ property_name: id, value: json() })) }),
          },
          async (_c, input) => call("POST", "/v1/property/update", {}, input),
        ),
      },
      { title: "Users", description: "User attributes of the agent." },
    ),
    workflows: router(
      {
        run: mutation(
          {
            description:
              "Run a workflow with the API key. input must match the workflow's start node parameters. Set isAsync to return a workflowRunId immediately and poll with workflows.queryResult.",
            input: object({ input: record(json()), userId: string().optional(), isAsync: boolean().optional() }),
          },
          async (_c, input) => call("POST", "/v1/workflow/invoke", {}, input),
        ),
        queryResult: query(
          { description: "Get the status and output of a workflow run.", input: object({ workflowRunId: id }) },
          async (_c, input) => call("POST", "/v1/workflow/query/result", {}, input),
        ),
      },
      { title: "Workflows", description: "Run GPTBots workflows and fetch their results." },
    ),
    analytics: router(
      {
        totalCredits: query(
          {
            description: "Total credit consumption by category. start_time and end_time are millisecond timestamps, at most 365 days apart.",
            input: object({ start_time: ms, end_time: ms }),
          },
          async (_c, input) => call("GET", "/v1/account/bill/total", input),
        ),
        dailyCredits: query(
          {
            description: "Credit consumption per day for up to 90 days. Times are millisecond timestamps.",
            input: object({ start_time: ms, end_time: ms }),
          },
          async (_c, input) => call("GET", "/v1/account/bill/page", input),
        ),
        conversationCredits: query(
          {
            description: "Credits per conversation within 30 days. Times are millisecond timestamps; page_size is at most 100.",
            input: object({
              start_time: ms,
              end_time: ms,
              page: number().optional(),
              page_size: number().optional(),
              conversation_id: string().optional(),
            }),
          },
          async (_c, input) => call("GET", "/v1/account/agent/conversation/credits", input),
        ),
        workflowRunCredits: query(
          {
            description: "Credits per workflow run within 30 days. Times are millisecond timestamps; page_size is at most 100.",
            input: object({
              start_time: ms,
              end_time: ms,
              page: number().optional(),
              page_size: number().optional(),
              run_id: string().optional(),
            }),
          },
          async (_c, input) => call("GET", "/v1/account/workflow/run/credits", input),
        ),
      },
      { title: "Analytics", description: "Credit consumption reports." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { gptbots: gptbots.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gptbots ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GPTBots",
        description:
          "GPTBots enterprise AI agents: chat with the agent, conversations and messages, knowledge bases and search, database tables, user attributes, workflows and credit analytics.",
        instructions:
          "An API key belongs to one agent, so every tool acts on that agent. Free plans allow 3 requests per minute; back off on HTTP 429 or code 40008. Timestamps are milliseconds since the epoch.",
        icons,
      },
    ),
  }),
);
