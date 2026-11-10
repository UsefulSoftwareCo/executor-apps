import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// GIPHY publishes no machine-readable description of its API, so this OpenAPI document is hand-written from
// https://developers.giphy.com/docs/api/endpoint/. The API key goes in the `api_key` query parameter. The upload
// endpoint (multipart POST to upload.giphy.com) and the analytics pingback host are not included.
const result = { type: "object", additionalProperties: true };
const ok = { description: "Success", content: { "application/json": { schema: result } } };
const param = (name: string, description: string, required = false, type = "string", location = "query") => ({
  name,
  in: location,
  required,
  description,
  schema: { type },
});

const customerId = param(
  "customer_id",
  "Your own stable per-user ID. If you have none, use the value from the random ID operation.",
);
const countryCode = param("country_code", "End user's country as ISO 3166-1 alpha-2. Send it if you proxy requests.");
const region = param("region", "End user's subdivision as ISO 3166-2. Send it with country_code if you proxy requests.");
const rating = param("rating", "Content rating filter: g, pg, pg-13 or r. All ratings are returned when omitted.");
const limit = (description: string) => param("limit", description, false, "integer");
const offset = (description: string) => param("offset", description, false, "integer");
const bundle = param("bundle", "Limits the renditions returned to a named bundle, for example messaging_non_clips.");
const lowContrast = param("remove_low_contrast", "Drops low-contrast items.", false, "boolean");

const common = [customerId, countryCode, region];
const get = (operationId: string, description: string, parameters: JsonObject[]) => ({
  get: { operationId, description, parameters, responses: { "200": ok } },
});

const kinds = ["gifs", "stickers"] as const;
const label = { gifs: "GIFs", stickers: "stickers" } as const;
const singular = { gifs: "gif", stickers: "sticker" } as const;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

const perKind: Record<string, JsonObject> = {};
for (const kind of kinds) {
  const n = label[kind];
  const id = cap(kind);
  perKind[`/v1/${kind}/search`] = get(`search${id}`, `Searches GIPHY ${n}. Returns data, pagination and meta.`, [
    param("q", "Search query, at most 50 characters. Send the user's exact terms. `@username` limits to that verified channel.", true),
    limit("Number of results, default 25 (beta keys are capped at 50)."),
    offset("Result offset, default 0, at most 4999."),
    param("channel_ids", "Comma-separated channel IDs to search within, at most 5."),
    param("lang", "Two-letter ISO 639-1 language code for regional content."),
    rating,
    bundle,
    lowContrast,
    ...common,
  ]);
  perKind[`/v1/${kind}/trending`] = get(`trending${id}`, `Returns the currently trending ${n}.`, [
    limit("Number of results, default 25."),
    offset("Result offset, default 0, at most 499."),
    rating,
    bundle,
    lowContrast,
    ...common,
  ]);
  perKind[`/v1/${kind}/translate`] = get(
    `translate${id}`,
    `Translates a word or phrase into a single ${singular[kind]} using GIPHY's translate algorithm.`,
    [param("s", "Term or phrase to translate. `@` targets a user channel and `#` a hashtag.", true), rating, ...common],
  );
  perKind[`/v1/${kind}/random`] = get(`random${cap(singular[kind])}`, `Returns one random ${singular[kind]}, optionally filtered by tag.`, [
    param("tag", "Optional tag filter. `@username` is supported. Fully random when omitted."),
    rating,
    ...common,
  ]);
}

export const document: JsonObject = {
  openapi: "3.0.3",
  info: { title: "GIPHY API", version: "1.0", description: "GIF and sticker search and retrieval." },
  servers: [{ url: "https://api.giphy.com" }],
  security: [{ apiKey: [] }],
  components: { securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "api_key" } } },
  paths: {
    ...perKind,
    "/v1/gifs/{gif_id}": get("getGifById", "Returns one GIF by its ID.", [
      param("gif_id", "The GIF ID.", true, "string", "path"),
      rating,
      ...common,
    ]),
    "/v1/gifs": get("getGifsByIds", "Returns several GIFs by ID.", [
      param("ids", "Comma-separated GIF IDs, at most 100.", true),
      rating,
      ...common,
    ]),
    "/v1/gifs/categories": get("listCategories", "Returns the GIF categories.", [customerId]),
    "/v1/gifs/search/tags": get("autocompleteTags", "Returns tag suggestions that complete a search term.", [
      param("q", "The tag term to complete.", true),
      limit("Number of suggestions, default 5."),
      offset("Result offset, default 0."),
      customerId,
    ]),
    "/v1/tags/related/{term}": get("getRelatedTags", "Returns search suggestions (related tags) for a term.", [
      param("term", "The term to find related tags for.", true, "string", "path"),
      customerId,
    ]),
    "/v1/trending/searches": get("listTrendingSearches", "Returns the currently trending search terms as an array of strings.", [customerId]),
    "/v1/channels/search": get("searchChannels", "Searches GIPHY channels.", [
      param("q", "Search query.", true),
      limit("Number of results, default 25, at most 50."),
      offset("Result offset, default 0."),
      customerId,
    ]),
    "/v1/randomid": get("getRandomId", "Returns an anonymous identifier to use as customer_id.", []),
    "/v2/emoji": get("listEmoji", "Returns GIPHY emoji. If an item's variation_count is above 0 it has variations.", [
      limit("Number of results, default 25."),
      offset("Result offset, default 0."),
      customerId,
    ]),
    "/v2/emoji/{gif_id}/variations": get("listEmojiVariations", "Returns the variations of an emoji.", [
      param("gif_id", "The ID of the emoji GIF object.", true, "string", "path"),
      customerId,
    ]),
  },
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.giphy.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "api_key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
