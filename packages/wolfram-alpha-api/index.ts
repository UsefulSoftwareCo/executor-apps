import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const apiBase = "https://api.wolframalpha.com";
const siteBase = "https://www.wolframalpha.com";

const wolfram = defineProvider({
  name: "Wolfram|Alpha API",
  hosts: ["api.wolframalpha.com", "www.wolframalpha.com"],
  auth: {
    apiKey: secrets({
      label: "AppID",
      fields: object({ appid: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Short Answers on a trivial input; only the 2xx status is checked, the plain-text body is not decoded.
    const url = new URL(`${apiBase}/v1/result`);
    url.searchParams.set("appid", account.fields.appid);
    url.searchParams.set("i", "1+1");
    const response = await fetch(url.toString(), { signal });
    if (!response.ok) throw new Error(`Wolfram|Alpha returned ${response.status}`);
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(appid: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const build = (base: string, path: string, params: Params) => {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("appid", appid);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const v of value) url.searchParams.append(key, String(v));
      else url.searchParams.set(key, String(value));
    }
    return url.toString();
  };
  // Errors carry only the status and response body, never the request URL (it holds the AppID).
  const text = async (base: string, path: string, params: Params) => {
    const response = await fetcher(build(base, path, params), { signal });
    const body = await response.text();
    if (!response.ok) throw new Error(`Wolfram|Alpha returned ${response.status}: ${body.slice(0, 500)}`);
    return { text: body };
  };
  return {
    json: async (base: string, path: string, params: Params) =>
      decodeJson(await fetcher(build(base, path, params), { signal }), json()),
    text,
    image: async (base: string, path: string, params: Params) => {
      const response = await fetcher(build(base, path, params), { signal });
      if (!response.ok) throw new Error(`Wolfram|Alpha returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { contentType: response.headers.get("content-type") ?? "image/gif", base64: btoa(binary) };
    },
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const req = () => string({ minLength: 1 });

function build(c: ReturnType<typeof client>) {
  return router({
    fullResults: query(
      {
        description:
          "Full Results API: structured pods and subpods for a query, returned as JSON. Supports pod selection (includepodid, excludepodid, podtitle, podindex; includepodid and excludepodid cannot be combined), assumptions (assumption: one assumption string, or several separated by newlines, which are sent as repeated assumption parameters; this is also how Instant Calculators are driven), podstate, location (location, latlong, ip), units and formats.",
        input: object({
          input: req(),
          format: optStr(),
          includepodid: optStr(),
          excludepodid: optStr(),
          podtitle: optStr(),
          podindex: optStr(),
          scanner: optStr(),
          assumption: optStr(),
          podstate: optStr(),
          location: optStr(),
          latlong: optStr(),
          ip: optStr(),
          units: optStr(),
          width: optNum(),
          maxwidth: optNum(),
          plotwidth: optNum(),
          mag: optNum(),
          scantimeout: optNum(),
          podtimeout: optNum(),
          formattimeout: optNum(),
          parsetimeout: optNum(),
          totaltimeout: optNum(),
          async: optStr(),
          reinterpret: optStr(),
          translation: optStr(),
          ignorecase: optStr(),
        }),
      },
      (_c, p) => {
        if (p.includepodid !== undefined && p.excludepodid !== undefined)
          throw new Error("includepodid and excludepodid cannot be combined");
        const assumption = p.assumption === undefined ? undefined : p.assumption.split("\n").filter((a) => a.length > 0);
        return c.json(apiBase, "/v2/query", { ...p, assumption, output: "json" });
      },
    ),
    llm: query(
      {
        description:
          "LLM API: Wolfram|Alpha results formatted as plain text for language models. maxchars caps the length (default 6800).",
        input: object({
          input: req(),
          maxchars: optNum(),
          assumption: optStr(),
          ip: optStr(),
          latlong: optStr(),
          location: optStr(),
          timezone: optStr(),
          units: optStr(),
          currency: optStr(),
          countrycode: optStr(),
          languagecode: optStr(),
          width: optNum(),
          maxwidth: optNum(),
          plotwidth: optNum(),
          mag: optNum(),
          scantimeout: optNum(),
          formattimeout: optNum(),
          parsetimeout: optNum(),
          totaltimeout: optNum(),
        }),
      },
      (_c, p) => c.text(siteBase, "/api/v1/llm-api", p),
    ),
    shortAnswer: query(
      {
        description: "Short Answers API: a single plain-text answer. units is metric or imperial. timeout is in seconds (default 5).",
        input: object({ i: req(), units: optStr(), timeout: optNum() }),
      },
      (_c, p) => c.text(apiBase, "/v1/result", p),
    ),
    spoken: query(
      {
        description: "Spoken Results API: a single conversational sentence suitable for speech. units is metric or imperial.",
        input: object({ i: req(), units: optStr(), timeout: optNum() }),
      },
      (_c, p) => c.text(apiBase, "/v1/spoken", p),
    ),
    simple: query(
      {
        description:
          "Simple API: an image of the full result page, returned as a base64 string with its content type. layout is divider or labelbar; foreground is black or white.",
        input: object({
          i: req(),
          layout: optStr(),
          background: optStr(),
          foreground: optStr(),
          fontsize: optNum(),
          width: optNum(),
          units: optStr(),
          timeout: optNum(),
        }),
      },
      (_c, p) => c.image(apiBase, "/v1/simple", p),
    ),
    recognizeQuery: query(
      {
        description:
          "Fast Query Recognizer: checks whether an input is likely to be understood by Wolfram|Alpha, with its domain and significance score. For Instant Calculators it also lists the formula and variables to build assumptions from. mode is Default or Voice.",
        input: object({ i: req(), mode: optStr() }),
      },
      (_c, { i, mode }) => c.json(siteBase, "/queryrecognizer/query.jsp", { i, mode: mode ?? "Default", output: "json" }),
    ),
    summaryBox: query(
      {
        description:
          "Summary Box API: fetch a precomputed summary box using the path returned by recognizeQuery (the path attribute of its summarybox element). Returns the XHTML document as a string (wasb-* classes); failures come back as an XML result with success=\"false\" and an error code.",
        input: object({ path: req() }),
      },
      (_c, { path }) => c.text(siteBase, "/summaryboxes/v1/query", { path }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { wolfram: wolfram.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.wolfram ?? [], (account) => build(client(account.fields.appid, fetch, signal)), { signal }),
      {
        title: "Wolfram|Alpha API",
        description:
          "Computational knowledge: Full Results, LLM, Short Answers, Spoken, Simple, Fast Query Recognizer and Summary Box APIs.",
        icons,
        instructions:
          "For model-friendly answers use llm; for one-line answers use shortAnswer; for structured pods use fullResults. A 501 means the input was not understood.",
      },
    ),
  }),
);
