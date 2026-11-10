import type { OpenapiToolNamesOptions } from "apps/openapi";

// DaData's three official OpenAPI documents, listed under "OpenAPI-схемы" at https://dadata.ru/api/.
// None declares security, so the credentials are described here: `Authorization: Token <api key>` everywhere,
// plus `X-Secret: <secret key>` for the Cleaner and Profile APIs.
const credentials = {
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "Authorization" },
    secretKey: { type: "apiKey", in: "header", name: "X-Secret" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "token", part: "value", prefix: "Token " },
      { scheme: "secretKey", field: "secret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

// The documents declare no security, so without fallbackSecurity every operation compiles as public and
// the credentials are never sent. Suggestions needs only the API key; Cleaner and Profile also need the secret key.
const tokenOnly = [{ apiKey: [] }];
const tokenAndSecret = [{ apiKey: [], secretKey: [] }];

type Patches = NonNullable<OpenapiToolNamesOptions["patches"]>;

const api = <const K extends Record<string, "query">>(
  file: string,
  origin: string,
  kinds: K,
  fallbackSecurity: typeof tokenOnly | typeof tokenAndSecret,
  patches: Patches = [],
) =>
  ({
    source: { url: `https://dadata.ru/files/openapi/${file}.yml` },
    allowedOrigin: origin,
    ...credentials,
    fallbackSecurity,
    patches,
    kinds,
  }) satisfies OpenapiToolNamesOptions;

const pathParam = (name: string, description: string) => [
  { name, in: "path", required: true, description, schema: { type: "string" } },
];

// The generic `{name}` operations are how DaData serves its reference directories, so say which names exist.
const suggestNames =
  "Directory to search: country, metro, currency, okved2, okpd2, mktu, court, car_brand, fms_unit (passport issuing authority), fns_unit (tax office), fts_unit (customs), medical_position, oktmo, okpdtr_position, okpdtr_profession, party_by (Belarus companies), party_kz (Kazakhstan companies), postal_unit (post office).";
const suggestionsPatches = [
  {
    op: "replace",
    path: "/paths/~1api~14_1~1rs~1suggest~1{name}/post/parameters",
    value: pathParam("name", suggestNames),
  },
  {
    op: "add",
    path: "/paths/~1api~14_1~1rs~1suggest~1{name}/post/description",
    value: `Autocomplete over a DaData reference directory. ${suggestNames}`,
  },
  {
    op: "replace",
    path: "/paths/~1api~14_1~1rs~1findById~1{name}/post/parameters",
    value: pathParam(
      "name",
      "Directory to look up by exact code: country, okved2, okpd2, delivery (city ids in delivery services), forwarder (forwarder registry), and the other directories listed for suggestOutward that support lookup by code.",
    ),
  },
  {
    op: "add",
    path: "/paths/~1api~14_1~1rs~1geolocate~1{name}/post/description",
    value: "Find objects near coordinates. `name` is `address` for addresses (see geoLocateAddress) or a directory such as `postal_unit` for the nearest post offices.",
  },
] as unknown as Patches;

const billing = "Billed per record to the DaData balance (about 0.20 RUB per address), although it changes nothing, so it runs without an approval prompt.";
const cleanerPatches = [
  { op: "add", path: "/paths/~1api~1v1~1clean~1{type}/post/description", value: `Standardize raw names, addresses, phones, emails, passports, vehicles and dates, one value per array item. ${billing}` },
  { op: "add", path: "/paths/~1api~1v1~1clean/post/description", value: `Standardize one record of several typed fields at once. ${billing}` },
] as unknown as Patches;

// Suggest, find and geolocate calls are POSTs that only read, so they run without an approval prompt.
export const suggestionsOptions = api("suggestions", "https://suggestions.dadata.ru", {
  suggestOutward: "query",
  suggestParty: "query",
  suggestFio: "query",
  suggestFias: "query",
  suggestEmail: "query",
  suggestBank: "query",
  suggestAddress: "query",
  ipLocateAddress: "query",
  geoLocateOutward: "query",
  geoLocateAddress: "query",
  findByIdOutward: "query",
  findByIdParty: "query",
  findByIdFias: "query",
  findByIdBank: "query",
  findByIdAddress: "query",
  findByEmailCompany: "query",
  findAffiliatedParty: "query",
}, tokenOnly, suggestionsPatches);
// Cleaning is paid but does not change state.
export const cleanerOptions = api("cleaner", "https://cleaner.dadata.ru", { cleanSimple: "query", cleanRecord: "query" }, tokenAndSecret, cleanerPatches);
export const profileOptions = api("profile", "https://dadata.ru", {}, tokenAndSecret);

// scripts/tools.ts reads `options`.
export const options = suggestionsOptions;
