import {
  accountRouter,
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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const base = "https://api.heygen.com";

const heygen = defineProvider({
  name: "HeyGen",
  hosts: ["api.heygen.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // GET /v3/users/me is the vendor's documented key check. Only `username` is always a non-null string.
    const response = await fetch(`${base}/v3/users/me`, {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    const { data } = await decodeJson(response, object({ data: object({ username: string() }) }));
    return { accountInfo: { externalId: data.username, displayName: data.username } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "X-API-KEY": account.fields.token,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

// Documented v3 endpoints that are absent from HeyGen's published OpenAPI document.
const v3Tools = (account: Account, signal: AbortSignal) =>
  router(
    {
      listVoices: query(
        {
          description:
            "List catalog voices (GET /v3/voices). type is public or private (default public); engine filters by speech engine (starfish, orca, elevenlabs); language like 'English'; gender male or female; limit 1-100 (default 20). Pass the previous next_token as token for the next page.",
          input: object({
            type: string().optional(),
            engine: string().optional(),
            language: string().optional(),
            gender: string().optional(),
            limit: number().optional(),
            token: string().optional(),
          }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/v3/voices?${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      getVoice: query(
        {
          description:
            "Get one voice (GET /v3/voices/{voice_id}). For cloned voices, status is processing, complete or failed.",
          input: object({ voice_id: string() }),
        },
        async ({ fetch }, { voice_id }) =>
          decodeJson(
            await fetch(`${base}/v3/voices/${encodeURIComponent(voice_id)}`, { signal, headers: headers(account) }),
            json(),
          ),
      ),
      generateSpeech: mutation(
        {
          description:
            "Text or SSML to speech with a catalog voice (POST /v3/voices/speech); consumes credits. Returns audio_url, duration and engine. text is 1-5000 characters; input_type is text or ssml; speed 0.5-2.0; engine is starfish, orca or elevenlabs (default: the voice's saved engine). Instant or professional clones use generateCloneSpeech instead.",
          input: object({
            text: string({ minLength: 1 }),
            voice_id: string(),
            input_type: string().optional(),
            speed: number().optional(),
            language: string().optional(),
            locale: string().optional(),
            force_regenerate: boolean().optional(),
            engine: string().optional(),
            settings: object({ model_id: string() }).optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${base}/v3/voices/speech`, {
              method: "POST",
              signal,
              headers: headers(account),
              body: JSON.stringify(input),
            }),
            json(),
          ),
      ),
      generateCloneSpeech: mutation(
        {
          description:
            "Text to speech with an ACTIVE instant or professional voice clone (POST /v3/models/audio/tts); consumes credits. Returns a 44.1 kHz WAV audio_url and duration. text is 1-5000 characters. expressiveness_boost (0-1) is instant voices only; seed, speed (0.75-1.25), pitch_shift (-4 to 4) and pitch_variance (0.5-2) are professional voices only. The SSE streaming variant is not exposed.",
          input: object({
            voice_id: string(),
            text: string({ minLength: 1 }),
            model: string().optional(),
            language: string().optional(),
            expressiveness_boost: number().optional(),
            seed: number().optional(),
            speed: number().optional(),
            pitch_shift: number().optional(),
            pitch_variance: number().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${base}/v3/models/audio/tts`, {
              method: "POST",
              signal,
              headers: headers(account),
              body: JSON.stringify(input),
            }),
            json(),
          ),
      ),
      listCloneVoices: query(
        {
          description:
            "List voice clones usable with generateCloneSpeech (GET /v3/models/audio/voices); each has a mode (instant or professional) and a status (ACTIVE, PENDING, FAILED).",
          input: object({}),
        },
        async ({ fetch }) =>
          decodeJson(await fetch(`${base}/v3/models/audio/voices`, { signal, headers: headers(account) }), json()),
      ),
      getAsset: query(
        {
          description: "Get one uploaded asset (GET /v3/assets/{asset_id}): id, name, type, owner, folder_id and url.",
          input: object({ asset_id: string() }),
        },
        async ({ fetch }, { asset_id }) =>
          decodeJson(
            await fetch(`${base}/v3/assets/${encodeURIComponent(asset_id)}`, { signal, headers: headers(account) }),
            json(),
          ),
      ),
      deleteAsset: mutation(
        {
          description: "Permanently delete an asset (DELETE /v3/assets/{asset_id}). Returns the removed id.",
          input: object({ asset_id: string() }),
          approval: always(),
        },
        async ({ fetch }, { asset_id }) =>
          decodeJson(
            await fetch(`${base}/v3/assets/${encodeURIComponent(asset_id)}`, {
              method: "DELETE",
              signal,
              headers: headers(account),
            }),
            json(),
          ),
      ),
      getCurrentUser: query(
        {
          description: "Get the current user (GET /v3/users/me): username, email, billing type and credit balance.",
          input: object({}),
        },
        async ({ fetch }) =>
          decodeJson(await fetch(`${base}/v3/users/me`, { signal, headers: headers(account) }), json()),
      ),
    },
    {
      title: "HeyGen v3",
      description: "Hand-written tools for documented v3 endpoints missing from the OpenAPI document: voices, text-to-speech, assets and current user.",
    },
  );

export default defineApp(
  { user: { accounts: { heygen: heygen.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.heygen ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        v3: await accountRouter(user?.accounts.heygen ?? [], (account) => v3Tools(account, signal), { signal }),
      },
      {
        title: "HeyGen",
        description: "Create AI avatar videos with HeyGen: videos, avatars, voices, templates, translation, photo avatars, streaming avatars, folders, assets and webhooks.",
        icons,
      },
    ),
  }),
);
