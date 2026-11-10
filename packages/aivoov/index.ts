import {
  accountRouter,
  array,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://aivoov.com/api/v8";

// AiVOOV reports auth failures, quota exhaustion and unknown voices as HTTP 200 with
// `{ status: false, error }`; speech-to-text uses `{ result: false, message }`. The /voices
// envelope is documented two ways (top-level array vs `{ status, message, data }`), so success
// is never required, only failure is rejected.
function assertOk(body: unknown): void {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return;
  const b = body as { status?: unknown; result?: unknown; error?: unknown; message?: unknown };
  if (b.status === false || b.result === false) {
    const detail = [b.error, b.message].find((v) => typeof v === "string");
    throw new Error(`AiVOOV request failed: ${detail ?? "unspecified error"}`);
  }
}

function checkInt(name: string, value: number | undefined, min: number, max: number): void {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}, got ${value}`);
  }
}

const aivoov = defineProvider({
  name: "AiVOOV",
  hosts: ["aivoov.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // AiVOOV has no account endpoint; /voices is the only free read. It is capped at 20 calls a day.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/voices?language_code=en-US`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    let body: unknown;
    try {
      body = await decodeJson(response, json());
      assertOk(body);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${reason}. Note: this check calls /voices, capped at 20 calls per day, so quota exhaustion also fails it and does not mean the API key is invalid.`,
      );
    }
  },
});

type Segment = {
  readonly voiceId: string;
  readonly text: string;
  readonly pitchRate?: number;
  readonly speakingRate?: number;
  readonly volume?: number;
};

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { "X-API-KEY": token, Accept: "application/json" };
  return router({
    listVoices: query(
      {
        description:
          "List available text-to-speech voices (voice_id, name, language, gender), optionally filtered by BCP-47 languageCode such as en-US. AiVOOV allows only 20 calls per day to this endpoint, so keep the result instead of calling it repeatedly.",
        input: object({ languageCode: string().optional() }),
      },
      async (_ctx, { languageCode }) => {
        const url = new URL(`${base}/voices`);
        if (languageCode !== undefined) url.searchParams.set("language_code", languageCode);
        const response = await fetcher(url.toString(), { signal, headers });
        const body = await decodeJson(response, json());
        assertOk(body);
        return body;
      },
    ),
    createAudio: mutation(
      {
        description:
          "Synthesize speech. Each segment pairs a voiceId with text; segments are rendered in order into one audio file, returned Base64-encoded in `audio`. Optional per-segment pitchRate (integers: -50 to 50), speakingRate (integer 20 to 200) and volume (integer -40 to 40); set one on every segment or none. Consumes character credits. Limit 75 requests per minute.",
        input: object({
          segments: array(
            object({
              voiceId: string({ minLength: 1 }),
              text: string({ minLength: 1 }),
              pitchRate: number().optional(),
              speakingRate: number().optional(),
              volume: number().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async (_ctx, { segments }) => {
        if (segments.length === 0) throw new Error("segments must contain at least one entry");
        segments.forEach((s, i) => {
          checkInt(`segments[${i}].pitchRate`, s.pitchRate, -50, 50);
          checkInt(`segments[${i}].speakingRate`, s.speakingRate, 20, 200);
          checkInt(`segments[${i}].volume`, s.volume, -40, 40);
        });
        const form = new URLSearchParams();
        const optional = [
          ["transcribe_ssml_pitch_rate[]", (s: Segment) => s.pitchRate],
          ["transcribe_ssml_spk_rate[]", (s: Segment) => s.speakingRate],
          ["transcribe_ssml_volume[]", (s: Segment) => s.volume],
        ] as const;
        for (const s of segments) {
          form.append("voice_id[]", s.voiceId);
          form.append("transcribe_text[]", s.text);
        }
        // The arrays pair by position, so a setting must be present on all segments or none.
        for (const [key, pick] of optional) {
          const values = segments.map(pick);
          if (values.every((v) => v === undefined)) continue;
          if (values.some((v) => v === undefined)) throw new Error(`${key} must be set on every segment or none`);
          for (const v of values) form.append(key, String(v));
        }
        const response = await fetcher(`${base}/create`, {
          method: "POST",
          signal,
          headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        const body = await decodeJson(response, json());
        assertOk(body);
        return body;
      },
    ),
    createTranscription: mutation(
      {
        description:
          "Start a speech-to-text job for an audio file (MP3, WAV, FLAC or OGG, up to 10 MB). Pass the file as Base64 in `audioBase64`, its `fileName` (with extension) and the `language` locale such as en-US. Returns a job_id with status IN_PROGRESS; poll getTranscription. Consumes character credits. Limits: 30 calls per minute, 1000 requests per day.",
        input: object({
          audioBase64: string({ minLength: 1 }),
          fileName: string({ minLength: 1 }),
          language: string({ minLength: 1 }),
        }),
        approval: always(),
      },
      async (_ctx, { audioBase64, fileName, language }) => {
        const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
        if (bytes.length > 10 * 1024 * 1024) throw new Error("audio file exceeds the 10 MB limit");
        const form = new FormData();
        form.append("file", new Blob([bytes]), fileName);
        form.append("language", language);
        // No Content-Type header: fetch sets the multipart boundary itself.
        const response = await fetcher(`${base}/speech`, { method: "POST", signal, headers, body: form });
        const body = await decodeJson(response, json());
        assertOk(body);
        return body;
      },
    ),
    getTranscription: query(
      {
        description:
          "Check a speech-to-text job by jobId. status is QUEUED, IN_PROGRESS, FAILED or COMPLETED; when COMPLETED the result has `text` (transcript) and `srt` (timestamped subtitles).",
        input: object({ jobId: string({ minLength: 1 }) }),
      },
      async (_ctx, { jobId }) => {
        const url = new URL(`${base}/job`);
        url.searchParams.set("job_id", jobId);
        const response = await fetcher(url.toString(), { signal, headers });
        const body = await decodeJson(response, json());
        assertOk(body);
        return body;
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { aivoov: aivoov.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.aivoov ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Aivoov",
        description: "AiVOOV text-to-speech: list voices, synthesize multi-voice speech audio and transcribe audio files.",
        icons,
      },
    ),
  }),
);
