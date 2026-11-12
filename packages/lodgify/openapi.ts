import type { OpenapiToolNamesOptions } from "apps/openapi";
import v1 from "./v1.json" with { type: "json" };
import v2 from "./v2.json" with { type: "json" };

type Document = Extract<OpenapiToolNamesOptions["source"], { document: unknown }>["document"];
type Parameter = { readonly name: string; readonly in: string };
type Operation = { readonly parameters: readonly Parameter[] };

const integer = (name: string, description: string, required = false) => ({
  name,
  in: "query",
  description,
  required,
  schema: { type: "integer", format: "int32" },
});

// Lodgify's quote endpoints take `roomTypes` and `addOns` as arrays of objects in the query string.
// Their reference pages say generated requests for them are invalid and give the format the API
// binds: `roomTypes[0].Id=1&roomTypes[0].guest_breakdown.adults=2&addOns[0].Id=3&addOns[0].Units=1`.
// These patches replace the two array parameters with those keys for one room type and one add-on.
const quote = (version: "v1" | "v2", document: { paths: Record<string, unknown> }) => {
  const path = `/${version}/quote/{propertyId}`;
  const operation = (document.paths[path] as { get?: Operation } | undefined)?.get;
  const names = operation?.parameters.map((parameter) => parameter.name) ?? [];
  if (!names.includes("roomTypes") || !names.includes("addOns"))
    throw new Error(`lodgify ${version}: ${path} no longer has roomTypes and addOns; revisit the quote patch`);
  const parameters = operation!.parameters.flatMap((parameter) =>
    parameter.name === "roomTypes"
      ? [
          integer("roomTypes[0].Id", "Room type identifier.", true),
          integer("roomTypes[0].guest_breakdown.adults", "Number of adults.", true),
          integer("roomTypes[0].guest_breakdown.children", "Number of children."),
          integer("roomTypes[0].guest_breakdown.infants", "Number of infants."),
          integer("roomTypes[0].guest_breakdown.pets", "Number of pets."),
        ]
      : parameter.name === "addOns"
        ? [integer("addOns[0].Id", "Optional add-on identifier."), integer("addOns[0].Units", "Units of the add-on.")]
        : [parameter],
  );
  return [{ op: "replace" as const, path: `/paths/${path.replaceAll("/", "~1")}/get/parameters`, value: parameters }];
};

// Lodgify's own OpenAPI documents for its Public API v1 and v2, as published in its ReadMe docs
// (docs.lodgify.com). v1 is also in ReadMe's public API registry; v2 is served only to a browser
// that passes the docs site's bot check, so both are committed by scripts/vendor-openapi.ts, which
// records the sources in info.x-executor-source. Both use the X-ApiKey header.
const api = (version: "v1" | "v2", document: { paths: Record<string, unknown> }) =>
  ({
    source: { document: document as unknown as Document },
    allowedOrigin: "https://api.lodgify.com",
    securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "X-ApiKey" } },
    methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    patches: quote(version, document),
  }) satisfies OpenapiToolNamesOptions;

export const v1Options = api("v1", v1);
export const v2Options = api("v2", v2);

// scripts/tools.ts reads `options`; v2 is the current API.
export const options = v2Options;
