import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const api = "https://api.nasa.gov";

// The api.nasa.gov key goes only to api.nasa.gov, in the X-Api-Key header that api.data.gov accepts.
// The other NASA services used here (image library, EONET, exoplanet archive, JPL SSD, TechPort)
// are keyless and are called without credentials. Header form per https://api.data.gov/docs/developer-manual/.
const nasa = defineProvider({
  name: "NASA",
  hosts: ["api.nasa.gov"],
  auth: {
    apiKey: secrets({
      label: "API key (use DEMO_KEY for a low rate limit)",
      fields: object({ token: string({ minLength: 1 }) }),
      request: ({ token }) => header("x-api-key", token),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/planetary/apod`, {
      signal,
      headers: { ...account.headers(), accept: "application/json" },
    });
    await decodeJson(response, object({ title: string() }));
  },
});

type Params = Record<string, string | number | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

type Account = { headers(): Record<string, string> };

const nasaTools = (account: Account, signal: AbortSignal) => {
  // Keyed requests carry the account's credential header; keyless services get none.
  const keyed = (path: string, params: Params = {}) => ({
    url: `${api}${path}${search(params)}`,
    init: { signal, headers: { ...account.headers(), accept: "application/json" } },
  });
  const open = (url: string, params: Params = {}) => ({
    url: `${url}${search(params)}`,
    init: { signal, headers: { accept: "application/json" } },
  });
  // Keyless technology.nasa.gov path form: /api/api/{patent|software|spinoff}/{keywords}.
  const techTransfer = (kind: "patent" | "software" | "spinoff", keywords: string) => ({
    url: `https://technology.nasa.gov/api/api/${kind}/${encodeURIComponent(keywords)}`,
    init: { signal, headers: { accept: "application/json" } },
  });
  type Req = { url: string; init: RequestInit };
  const run = (fetch: typeof globalThis.fetch, req: Req) => fetchJson(fetch, req);
  const fetchJson = async (fetch: typeof globalThis.fetch, req: Req) =>
    decodeJson(await fetch(req.url, req.init), json());

  const date = "Date as YYYY-MM-DD.";
  const donki = (name: string, description: string) =>
    query(
      {
        description: `${description} startDate and endDate are YYYY-MM-DD and default to the last 30 days and today.`,
        input: object({ startDate: string().optional(), endDate: string().optional() }),
      },
      async ({ fetch }, input) => run(fetch, keyed(`/DONKI/${name}`, input)),
    );

  return router({
    apod: query(
      {
        description: `Astronomy Picture of the Day. Pass date for one day, startDate and endDate for a range, or count for that many random pictures (these are mutually exclusive). ${date} thumbs=true returns a thumbnail URL for video entries.`,
        input: object({
          date: string().optional(),
          startDate: string().optional(),
          endDate: string().optional(),
          count: number().optional(),
          thumbs: string().optional(),
        }),
      },
      async ({ fetch }, { startDate, endDate, ...input }) =>
        run(fetch, keyed("/planetary/apod", { ...input, start_date: startDate, end_date: endDate })),
    ),
    neoFeed: query(
      {
        description:
          "Near-Earth objects by close-approach date from NeoWs. startDate (YYYY-MM-DD) is required; endDate defaults to 7 days after it and the range is at most 7 days.",
        input: object({ startDate: string(), endDate: string().optional() }),
      },
      async ({ fetch }, { startDate, endDate }) =>
        run(fetch, keyed("/neo/rest/v1/feed", { start_date: startDate, end_date: endDate })),
    ),
    neoLookup: query(
      {
        description: "Look up one near-Earth object by its NASA JPL small-body (SPK-ID) id, for example 3542519.",
        input: object({ asteroidId: string() }),
      },
      async ({ fetch }, { asteroidId }) =>
        run(fetch, keyed(`/neo/rest/v1/neo/${encodeURIComponent(asteroidId)}`)),
    ),
    neoBrowse: query(
      {
        description: "Browse the whole near-Earth object data set, paginated (page from 0, size up to 20).",
        input: object({ page: number().optional(), size: number().optional() }),
      },
      async ({ fetch }, input) => run(fetch, keyed("/neo/rest/v1/neo/browse", input)),
    ),
    donkiCoronalMassEjections: donki("CME", "Coronal mass ejection events from DONKI."),
    donkiCoronalMassEjectionAnalyses: query(
      {
        description:
          "Coronal mass ejection analyses from DONKI. startDate and endDate are YYYY-MM-DD. mostAccurateOnly, completeEntryOnly (true/false), speed (lower bound km/s), halfAngle (lower bound degrees) and catalog (for example ALL or SWRC_CATALOG) filter the results.",
        input: object({
          startDate: string().optional(),
          endDate: string().optional(),
          mostAccurateOnly: string().optional(),
          completeEntryOnly: string().optional(),
          speed: number().optional(),
          halfAngle: number().optional(),
          catalog: string().optional(),
        }),
      },
      async ({ fetch }, input) => run(fetch, keyed("/DONKI/CMEAnalysis", input)),
    ),
    donkiGeomagneticStorms: donki("GST", "Geomagnetic storm events from DONKI."),
    donkiInterplanetaryShocks: donki("IPS", "Interplanetary shock events from DONKI."),
    donkiSolarFlares: donki("FLR", "Solar flare events from DONKI."),
    donkiSolarEnergeticParticles: donki("SEP", "Solar energetic particle events from DONKI."),
    donkiMagnetopauseCrossings: donki("MPC", "Magnetopause crossing events from DONKI."),
    donkiRadiationBeltEnhancements: donki("RBE", "Radiation belt enhancement events from DONKI."),
    donkiHighSpeedStreams: donki("HSS", "High speed stream events from DONKI."),
    donkiNotifications: query(
      {
        description:
          "Space weather notifications from DONKI. type is one of all, FLR, SEP, CME, IPS, MPC, GST, RBE, report. startDate and endDate are YYYY-MM-DD.",
        input: object({ startDate: string().optional(), endDate: string().optional(), type: string().optional() }),
      },
      async ({ fetch }, input) => run(fetch, keyed("/DONKI/notifications", input)),
    ),
    marsRovers: query(
      {
        description: "List the Mars rovers (Curiosity, Opportunity, Spirit, Perseverance) with status, landing date and camera list.",
        input: object({}),
      },
      async ({ fetch }) => run(fetch, keyed("/mars-photos/api/v1/rovers")),
    ),
    marsRoverManifest: query(
      {
        description: "Mission manifest of one rover (curiosity, opportunity, spirit, perseverance): photo counts per sol and the cameras used.",
        input: object({ rover: string() }),
      },
      async ({ fetch }, { rover }) =>
        run(fetch, keyed(`/mars-photos/api/v1/manifests/${encodeURIComponent(rover)}`)),
    ),
    marsRoverPhotos: query(
      {
        description:
          "Photos taken by a Mars rover (curiosity, opportunity, spirit, perseverance). Give either sol (Martian day) or earthDate (YYYY-MM-DD). camera is an optional camera abbreviation such as FHAZ, NAVCAM or MAST; page is 1-based with 25 photos per page.",
        input: object({
          rover: string(),
          sol: number().optional(),
          earthDate: string().optional(),
          camera: string().optional(),
          page: number().optional(),
        }),
      },
      async ({ fetch }, { rover, earthDate, ...input }) =>
        run(
          fetch,
          keyed(`/mars-photos/api/v1/rovers/${encodeURIComponent(rover)}/photos`, {
            ...input,
            earth_date: earthDate,
          }),
        ),
    ),
    marsRoverLatestPhotos: query(
      {
        description: "The most recent photos from a Mars rover, taken on its latest sol with photos.",
        input: object({ rover: string(), page: number().optional() }),
      },
      async ({ fetch }, { rover, page }) =>
        run(fetch, keyed(`/mars-photos/api/v1/rovers/${encodeURIComponent(rover)}/latest_photos`, { page })),
    ),
    epicImages: query(
      {
        description:
          "EPIC images of the whole Earth from the DSCOVR satellite. collection is natural (default) or enhanced. Give date (YYYY-MM-DD) for one day, or omit it for the most recent day. Each result's image name builds the archive URL https://api.nasa.gov/EPIC/archive/<collection>/<yyyy>/<mm>/<dd>/png/<image>.png.",
        input: object({ collection: string().optional(), date: string().optional() }),
      },
      async ({ fetch }, { collection, date }) => {
        const base = `/EPIC/api/${collection ?? "natural"}`;
        return run(fetch, keyed(date === undefined ? base : `${base}/date/${encodeURIComponent(date)}`));
      },
    ),
    epicAvailableDates: query(
      {
        description: "Dates (YYYY-MM-DD) that have EPIC imagery. collection is natural (default) or enhanced.",
        input: object({ collection: string().optional() }),
      },
      async ({ fetch }, { collection }) => run(fetch, keyed(`/EPIC/api/${collection ?? "natural"}/all`)),
    ),
    earthImagery: query(
      {
        description:
          "Landsat 8 satellite image URL for a location. lat and lon are decimal degrees; date (YYYY-MM-DD) picks the closest earlier image; dim is the image width and height in degrees (default 0.025).",
        input: object({ lat: number(), lon: number(), date: string().optional(), dim: number().optional() }),
      },
      async ({ fetch }, input) => run(fetch, keyed("/planetary/earth/imagery", input)),
    ),
    earthAssets: query(
      {
        description: "Dates and asset ids of available Landsat 8 imagery for a location. lat and lon are decimal degrees; date (YYYY-MM-DD) is the start date; dim is the area size in degrees.",
        input: object({ lat: number(), lon: number(), date: string().optional(), dim: number().optional() }),
      },
      async ({ fetch }, input) => run(fetch, keyed("/planetary/earth/assets", input)),
    ),
    techTransferPatents: query(
      {
        description: "Search NASA technology transfer patents by keyword.",
        input: object({ query: string() }),
      },
      async ({ fetch }, { query: q }) => run(fetch, techTransfer("patent", q)),
    ),
    techTransferSoftware: query(
      {
        description: "Search NASA technology transfer software catalog entries by keyword.",
        input: object({ query: string() }),
      },
      async ({ fetch }, { query: q }) => run(fetch, techTransfer("software", q)),
    ),
    techTransferSpinoffs: query(
      {
        description: "Search NASA spinoff stories (commercial products derived from NASA technology) by keyword.",
        input: object({ query: string() }),
      },
      async ({ fetch }, { query: q }) => run(fetch, techTransfer("spinoff", q)),
    ),
    imageLibrarySearch: query(
      {
        description:
          "Search the NASA Image and Video Library (no key needed). q is free text; keywords, center, nasaId, location, photographer, title and description narrow it; mediaType is image, video or audio (comma-separate for several); yearStart and yearEnd are four-digit years; page is 1-based and pageSize defaults to 100.",
        input: object({
          q: string().optional(),
          keywords: string().optional(),
          center: string().optional(),
          nasaId: string().optional(),
          location: string().optional(),
          photographer: string().optional(),
          title: string().optional(),
          description: string().optional(),
          mediaType: string().optional(),
          yearStart: string().optional(),
          yearEnd: string().optional(),
          page: number().optional(),
          pageSize: number().optional(),
        }),
      },
      async ({ fetch }, { nasaId, mediaType, yearStart, yearEnd, pageSize, ...input }) =>
        run(
          fetch,
          open("https://images-api.nasa.gov/search", {
            ...input,
            nasa_id: nasaId,
            media_type: mediaType,
            year_start: yearStart,
            year_end: yearEnd,
            page_size: pageSize,
          }),
        ),
    ),
    imageLibraryAsset: query(
      {
        description: "Media file URLs (original, large, medium, small, thumbnail, captions) for one NASA Image and Video Library item by nasa_id.",
        input: object({ nasaId: string() }),
      },
      async ({ fetch }, { nasaId }) =>
        run(fetch, open(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`)),
    ),
    imageLibraryMetadata: query(
      {
        description: "URL of the full metadata JSON file for one NASA Image and Video Library item by nasa_id.",
        input: object({ nasaId: string() }),
      },
      async ({ fetch }, { nasaId }) =>
        run(fetch, open(`https://images-api.nasa.gov/metadata/${encodeURIComponent(nasaId)}`)),
    ),
    eonetEvents: query(
      {
        description:
          "Natural events tracked by NASA EONET (wildfires, storms, volcanoes, sea and lake ice and more; no key needed). status is open (default), closed or all; category is a comma-separated list of category ids such as wildfires or severeStorms; source filters by source id; days limits to events from the last N days; limit caps the count; start and end are YYYY-MM-DD; bbox is minLon,maxLat,maxLon,minLat.",
        input: object({
          status: string().optional(),
          category: string().optional(),
          source: string().optional(),
          days: number().optional(),
          limit: number().optional(),
          start: string().optional(),
          end: string().optional(),
          bbox: string().optional(),
        }),
      },
      async ({ fetch }, input) => run(fetch, open("https://eonet.gsfc.nasa.gov/api/v3/events", input)),
    ),
    eonetEvent: query(
      {
        description: "One EONET natural event by id, for example EONET_6034.",
        input: object({ eventId: string() }),
      },
      async ({ fetch }, { eventId }) =>
        run(fetch, open(`https://eonet.gsfc.nasa.gov/api/v3/events/${encodeURIComponent(eventId)}`)),
    ),
    eonetCategories: query(
      {
        description: "The EONET event categories (id, title, description) that events can be filtered by.",
        input: object({}),
      },
      async ({ fetch }) => run(fetch, open("https://eonet.gsfc.nasa.gov/api/v3/categories")),
    ),
    exoplanetQuery: query(
      {
        description:
          "Run an ADQL/SQL query against the NASA Exoplanet Archive TAP service (no key needed), for example \"select top 10 pl_name, hostname, disc_year from ps where default_flag=1 order by disc_year desc\". Common tables: ps (planetary systems), pscomppars (composite parameters), stellarhosts, keplernames. Returns JSON rows.",
        input: object({ query: string() }),
      },
      async ({ fetch }, { query: q }) =>
        run(fetch, open("https://exoplanetarchive.ipac.caltech.edu/TAP/sync", { query: q, format: "json" })),
    ),
    closeApproaches: query(
      {
        description:
          "Asteroid and comet close approaches from JPL's SBDB Close-Approach Data API (no key needed). dateMin and dateMax are YYYY-MM-DD or 'now'; distMax is the maximum distance such as 0.05 (au) or 10LD (lunar distances); body is the approached body (default Earth); des is a small-body designation; sort is for example date or dist; limit caps the rows; fullname=true adds full names.",
        input: object({
          dateMin: string().optional(),
          dateMax: string().optional(),
          distMax: string().optional(),
          body: string().optional(),
          des: string().optional(),
          sort: string().optional(),
          limit: number().optional(),
          fullname: string().optional(),
        }),
      },
      async ({ fetch }, { dateMin, dateMax, distMax, ...input }) =>
        run(
          fetch,
          open("https://ssd-api.jpl.nasa.gov/cad.api", {
            ...input,
            "date-min": dateMin,
            "date-max": dateMax,
            "dist-max": distMax,
          }),
        ),
    ),
    fireballs: query(
      {
        description:
          "Fireball (bolide) atmospheric impact events reported by US government sensors, from JPL's Fireball API (no key needed). dateMin and dateMax are YYYY-MM-DD; reqLoc=true restricts to events with a location; limit caps the rows; sort is for example -date.",
        input: object({
          dateMin: string().optional(),
          dateMax: string().optional(),
          reqLoc: string().optional(),
          limit: number().optional(),
          sort: string().optional(),
        }),
      },
      async ({ fetch }, { dateMin, dateMax, reqLoc, ...input }) =>
        run(
          fetch,
          open("https://ssd-api.jpl.nasa.gov/fireball.api", {
            ...input,
            "date-min": dateMin,
            "date-max": dateMax,
            "req-loc": reqLoc,
          }),
        ),
    ),
    sentryObjects: query(
      {
        description:
          "Earth impact risk objects from JPL's Sentry API (no key needed). With no arguments lists all objects with a nonzero impact probability; des looks up one object's impact solutions by designation; spk looks up by SPK-ID.",
        input: object({ des: string().optional(), spk: string().optional() }),
      },
      async ({ fetch }, input) => run(fetch, open("https://ssd-api.jpl.nasa.gov/sentry.api", input)),
    ),
    techportProject: query(
      {
        description: "One NASA TechPort technology project by numeric project id (no key needed): title, description, benefits, organizations, TRL and program.",
        input: object({ projectId: number() }),
      },
      async ({ fetch }, { projectId }) => run(fetch, open(`https://techport.nasa.gov/api/projects/${projectId}`)),
    ),
    techportProjects: query(
      {
        description: "List NASA TechPort project ids with last-updated dates (no key needed). updatedSince is YYYY-MM-DD and limits the list to projects changed since then.",
        input: object({ updatedSince: string().optional() }),
      },
      async ({ fetch }, { updatedSince }) => run(fetch, open("https://techport.nasa.gov/api/projects", { updatedSince })),
    ),
  });
};

export default defineApp({ user: { accounts: { nasa: nasa.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.nasa ?? [], (account) => nasaTools(account, signal), { signal }), {
    title: "NASA",
    description:
      "NASA open data: Astronomy Picture of the Day, near-Earth objects, space weather (DONKI), Mars rover photos, EPIC and Landsat Earth imagery, EONET natural events, the image library, exoplanets, JPL close approaches and fireballs, and technology transfer.",
    icons,
  }),
}));
