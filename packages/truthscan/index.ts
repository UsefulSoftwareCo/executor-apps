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
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const host = (kind: string) => `https://detect-${kind}.truthscan.com`;

const truthscan = defineProvider({
  name: "TruthScan",
  hosts: ["detect-text.truthscan.com", "detect-image.truthscan.com", "detect-audio.truthscan.com", "detect-video.truthscan.com", "detect-pdf.truthscan.com"],
  auth: {
    // Keys come from the developer portal on truthscan.com. The API wants it in an `apikey` header or a `key` body field depending on the endpoint.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${host("text")}/check-user-credits`, {
      signal,
      headers: { apikey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Kind = "text" | "image" | "audio" | "video" | "pdf";

function client(key: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (kind: Kind, method: "GET" | "POST", path: string, options: { search?: Record<string, unknown>; body?: Record<string, unknown> } = {}) => {
    const target = new URL(`${host(kind)}${path}`);
    for (const [name, value] of Object.entries(options.search ?? {})) {
      if (value !== undefined) target.searchParams.set(name, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        apikey: key,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    return decodeJson(response, json());
  };
  // Submit endpoints take the key in the JSON body; drop unset optional fields.
  const withKey = (args: Record<string, unknown>) => ({
    ...Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined)),
    key,
  });
  const queryTool = (kind: Kind, what: string) =>
    query(
      {
        description: `Poll the result of a ${what} detection job by the id returned when it was submitted. status is pending, analyzing, done or failed.`,
        input: object({ id: string() }),
      },
      async (_ctx, args) => send(kind, "POST", "/query", { body: { id: args.id } }),
    );
  const uploadTool = (kind: Kind, what: string, extra: string) =>
    query(
      {
        description: `Step 1 of ${what} detection: get a presigned upload URL. PUT the file bytes to presigned_url (headers Content-Type matching the file and x-amz-acl: private), then submit file_path to the detect tool. ${extra}`,
        input: object({ file_name: string(), expiration: number().optional() }),
      },
      async (_ctx, args) => send(kind, "GET", "/get-presigned-url", { search: { file_name: args.file_name, expiration: args.expiration } }),
    );
  const credits = (kind: Kind) =>
    query(
      { description: `Credit balance (baseCredits, boostCredits, credits) as reported by the ${kind} detector.`, input: object({}) },
      async () => send(kind, "GET", "/check-user-credits"),
    );

  return router({
    credits: router({
      text: credits("text"),
      image: credits("image"),
      audio: credits("audio"),
      video: credits("video"),
      pdf: credits("pdf"),
    }),
    text: router({
      detect: mutation(
        {
          description:
            "Submit text (under 30,000 words, 200+ recommended) for AI detection. Costs 1 credit per word. Returns an id; poll text.query. Result under 50 is human, over 60 is AI.",
          input: object({
            text: string(),
            model: string().optional(),
            generate_analysis_details: boolean().optional(),
            retry_count: number().optional(),
          }),
        },
        async (_ctx, args) => send("text", "POST", "/detect", { body: withKey(args) }),
      ),
      query: queryTool("text", "text"),
    }),
    image: router({
      getUploadUrl: uploadTool("image", "image", "Files must be 1KB to 10MB; use .zip for bulk."),
      detect: mutation(
        {
          description:
            "Submit an uploaded image for AI-generated/edited detection. url is the storage host plus the file_path returned by image.getUploadUrl. Returns an id; poll image.query.",
          input: object({
            url: string(),
            model: string().optional(),
            generate_preview: boolean().optional(),
            generate_analysis_details: boolean().optional(),
            generate_heatmap: boolean().optional(),
          }),
        },
        async (_ctx, args) => send("image", "POST", "/detect", { body: withKey(args) }),
      ),
      query: queryTool("image", "image"),
    }),
    audio: router({
      getUploadUrl: uploadTool("audio", "audio", "Formats: MP3, WAV, M4A, FLAC, OGG, MP4; 1KB to 100MB."),
      detect: mutation(
        {
          description:
            "Submit an uploaded audio file for AI voice detection. url is the file_path returned by audio.getUploadUrl. analyzeUpToSeconds (default 60) caps the credit cost. Returns an id; poll audio.query.",
          input: object({ url: string(), analyzeUpToSeconds: number().optional(), document_type: string().optional() }),
        },
        async (_ctx, args) => send("audio", "POST", "/detect", { body: withKey(args) }),
      ),
      query: queryTool("audio", "audio"),
    }),
    video: router({
      detect: mutation(
        {
          description:
            "Submit a video by URL for deepfake/AI detection (mp4, mov, avi, mkv, webm; 1KB to 100MB). model is generic (default) or faceswap. Returns an id; poll video.query.",
          input: object({ url: string(), model: string().optional(), document_type: string().optional() }),
        },
        async (_ctx, args) => send("video", "POST", "/detect", { body: withKey(args) }),
      ),
      query: queryTool("video", "video"),
    }),
    pdf: router({
      getUploadUrl: uploadTool("pdf", "PDF", "file_name must end in .pdf; max 10MB."),
      detect: mutation(
        {
          description:
            "Submit an uploaded PDF for AI-generated or tampered detection. url is the file_path returned by pdf.getUploadUrl. Costs 1,000 credits per page. model defaults to pdf_detector (v5); modules may include metadata and structure. Returns an id; poll pdf.query.",
          input: object({ url: string(), model: string().optional(), modules: array(string()).optional() }),
        },
        async (_ctx, args) => send("pdf", "POST", "/detect-pdf", { body: withKey(args) }),
      ),
      query: queryTool("pdf", "PDF"),
    }),
  });
}

export default defineApp(
  { user: { accounts: { truthscan: truthscan.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.truthscan ?? [],
        (account) =>
          withApprovals(client(account.fields.token, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "TruthScan",
        description: "Detect AI-generated and manipulated text, images, audio, video and PDFs, and check your credit balance.",
        icons,
      },
    ),
  }),
);
