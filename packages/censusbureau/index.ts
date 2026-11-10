import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const data = "https://api.census.gov/data";
const geocoder = "https://geocoding.geo.census.gov/geocoder";

const census = defineProvider({
  name: "Census Bureau",
  hosts: ["api.census.gov"],
  auth: {
    // Request a free key at https://api.census.gov/data/key_signup.html; it is sent as the `key` query parameter.
    apiKey: secrets({
      label: "API key",
      fields: object({ key: string({ minLength: 1 }) }),
      request: ({ key }) => query("key", key),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${data}/2020/dec/pl?get=NAME&for=state:01`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | undefined>;

const Path = string({ minLength: 1 });
const pathHelp =
  "Dataset path under /data without leading slash, for example 2022/acs/acs5 or 2020/dec/pl (find them with datasets.list).";

function dataPath(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, "").replace(/\.json$/, "");
  if (!/^[A-Za-z0-9_\-\/]+$/.test(clean)) throw new Error("Invalid dataset path.");
  return clean;
}

function censusApi(account: { url(url: string): string; headers(): Record<string, string> }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const get = async (path: string, params: [string, string][] = []) => {
    const target = new URL(`${data}/${path}`);
    for (const [name, value] of params) target.searchParams.append(name, value);
    const response = await fetcher(account.url(target.toString()), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    return decodeJson(response, json());
  };

  const Query = {
    get: array(string()).optional(),
    for: string().optional(),
    in: array(string()).optional(),
    ucgid: string().optional(),
    predicates: record(string()).optional(),
  };
  type QueryArgs = {
    get?: readonly string[];
    for?: string;
    in?: readonly string[];
    ucgid?: string;
    predicates?: Readonly<Record<string, string>>;
  };
  const run = async (path: string, args: QueryArgs) => {
    const params: [string, string][] = [];
    if (args.get?.length) params.push(["get", args.get.join(",")]);
    if (args.for) params.push(["for", args.for]);
    if (args.in?.length) params.push(["in", args.in.join(" ")]);
    if (args.ucgid) params.push(["ucgid", args.ucgid]);
    for (const [name, value] of Object.entries(args.predicates ?? {})) params.push([name, value]);
    const rows = (await get(dataPath(path), params)) as unknown[][];
    const [columns, ...values] = rows;
    return { columns: columns ?? [], rows: values };
  };
  const queryHelp =
    "get: variable or group names, e.g. [\"NAME\",\"B01001_001E\"] or [\"group(B01001)\"]. for: geography, e.g. \"state:*\" or \"county:037\". in: parent geographies, e.g. [\"state:06\"] or [\"state:01\",\"place:07000\"]; entries are joined with spaces into one in clause. ucgid: Census universal geography id. predicates: extra filters such as {\"YEAR\":\"2020\",\"NAICS2017\":\"72\"}. Returns {columns, rows}.";

  const meta = (name: string, file: string, description: string) =>
    query({ description: `${description} ${pathHelp}`, input: object({ path: Path }) }, async (_ctx, { path }) =>
      get(file === "" ? `${dataPath(path)}.json` : `${dataPath(path)}/${file}`),
    );

  return {
      datasets: router({
        list: query(
          {
            description:
              "List datasets in the Census Data API catalog (about 1,800 across ACS, decennial census, economic census, population estimates, surveys). Filter by text in the title, description or path, and by vintage year.",
            input: object({
              search: string().optional(),
              vintage: number().optional(),
              limit: number().default(50),
            }),
          },
          async (_ctx, { search, vintage, limit }) => {
            const catalog = (await get("../data.json")) as { dataset: Record<string, unknown>[] };
            const term = search?.toLowerCase();
            return catalog.dataset
              .filter((d) => {
                if (vintage !== undefined && d.c_vintage !== vintage) return false;
                if (term === undefined) return true;
                const hay = `${d.title} ${d.description} ${(d.c_dataset as string[] | undefined)?.join("/")}`.toLowerCase();
                return hay.includes(term);
              })
              .slice(0, limit)
              .map((d) => ({
                title: d.title,
                path: `${d.c_vintage === undefined ? "" : `${d.c_vintage}/`}${(d.c_dataset as string[]).join("/")}`,
                vintage: d.c_vintage ?? null,
                description: d.description,
                variables: d.c_variablesLink,
                geography: d.c_geographyLink,
              }));
          },
        ),
        describe: meta("describe", "", "Get a dataset's metadata (title, description, links)."),
        variables: meta("variables", "variables.json", "List every variable of a dataset with label, concept, predicate type and group."),
        geography: meta("geography", "geography.json", "List the geography levels (for/in clauses) a dataset supports."),
        groups: meta("groups", "groups.json", "List a dataset's variable groups (tables)."),
        examples: meta("examples", "examples.json", "List example queries for a dataset."),
        group: query(
          { description: `Get the variables of one group (table) of a dataset, e.g. B01001. ${pathHelp}`, input: object({ path: Path, group: string({ minLength: 1 }) }) },
          async (_ctx, { path, group }) => get(`${dataPath(path)}/groups/${encodeURIComponent(group)}.json`),
        ),
      }),
      data: router({
        query: query(
          { description: `Query any Census Data API dataset. ${pathHelp} ${queryHelp}`, input: object({ path: Path, ...Query }) },
          async (_ctx, { path, ...args }) => run(path, args),
        ),
        acs5: query(
          {
            description: `Query the American Community Survey 5-year estimates for a year. ${queryHelp}`,
            input: object({ year: number(), ...Query }),
          },
          async (_ctx, { year, ...args }) => run(`${year}/acs/acs5`, args),
        ),
        acs1: query(
          {
            description: `Query the American Community Survey 1-year estimates for a year (areas of 65,000+ people). ${queryHelp}`,
            input: object({ year: number(), ...Query }),
          },
          async (_ctx, { year, ...args }) => run(`${year}/acs/acs1`, args),
        ),
        decennialPl: query(
          {
            description: `Query the decennial census redistricting data (PL 94-171) for 2020, 2010 or 2000. ${queryHelp}`,
            input: object({ year: number().default(2020), ...Query }),
          },
          async (_ctx, { year, ...args }) => run(`${year}/dec/pl`, args),
        ),
      }),
  };
}

const Benchmark = {
  benchmark: string().default("Public_AR_Current"),
  vintage: string().default("Current_Current"),
};

async function geocode(fetcher: Fetch, signal: AbortSignal | undefined, kind: string, mode: string, params: Params) {
  const target = new URL(`${geocoder}/${kind}/${mode}`);
  for (const [name, value] of Object.entries(params)) if (value !== undefined) target.searchParams.set(name, value);
  target.searchParams.set("format", "json");
  const response = await fetcher(target.toString(), { signal, headers: { Accept: "application/json" } });
  return decodeJson(response, json());
}

function geocoderTools(fetcher: Fetch, signal: AbortSignal | undefined) {
  const parts = {
    street: string({ minLength: 1 }),
    city: string().optional(),
    state: string().optional(),
    zip: string().optional(),
  };
  return {
    locationFromAddress: query(
      {
        description: "Geocode a one-line US address to coordinates. Free, no key; uses the Census Geocoder.",
        input: object({ address: string({ minLength: 1 }), ...Benchmark }),
      },
      async (_ctx, { address, benchmark }) => geocode(fetcher, signal, "locations", "onelineaddress", { address, benchmark }),
    ),
    locationFromParts: query(
      { description: "Geocode a US address given as street, city, state and ZIP to coordinates.", input: object({ ...parts, benchmark: Benchmark.benchmark }) },
      async (_ctx, args) => geocode(fetcher, signal, "locations", "address", args),
    ),
    geographiesFromAddress: query(
      {
        description:
          "Geocode a one-line US address and return the Census geographies containing it (state, county, tract, block, congressional district...).",
        input: object({ address: string({ minLength: 1 }), ...Benchmark }),
      },
      async (_ctx, { address, benchmark, vintage }) => geocode(fetcher, signal, "geographies", "onelineaddress", { address, benchmark, vintage }),
    ),
    geographiesFromParts: query(
      { description: "Return the Census geographies containing a US address given as street, city, state and ZIP.", input: object({ ...parts, ...Benchmark }) },
      async (_ctx, args) => geocode(fetcher, signal, "geographies", "address", args),
    ),
    geographiesFromCoordinates: query(
      {
        description: "Return the Census geographies (state, county, tract, block...) containing a longitude and latitude (x is longitude, y is latitude).",
        input: object({ x: number(), y: number(), ...Benchmark }),
      },
      async (_ctx, { x, y, benchmark, vintage }) =>
        geocode(fetcher, signal, "geographies", "coordinates", { x: String(x), y: String(y), benchmark, vintage }),
    ),
  };
}

export default defineApp(
  { user: { accounts: { census: census.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.census ?? [],
        (account) =>
          router({
            ...censusApi(account, fetch, signal),
            geocoder: router(geocoderTools(fetch, signal), { title: "Geocoder", description: "Census Geocoder: free address to coordinate and geography lookups." }),
          }),
        { signal },
      ),
      {
        title: "Census Bureau",
        description:
          "U.S. Census Bureau statistics: dataset catalog, variables and geographies, ACS and decennial census queries, and the Census Geocoder.",
        icons,
      },
    ),
  }),
);
