import {
  accountRouter,
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

const base = "https://api.discogs.com";
const userAgent = "ExecutorDiscogs/1.0 (+https://executor.sh)";

const discogs = defineProvider({
  name: "Discogs",
  hosts: ["api.discogs.com"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/oauth/identity`, { signal, headers: headers(account.fields.token) });
    const identity = await decodeJson(response, object({ id: number(), username: string() }));
    return { accountInfo: { externalId: String(identity.id), displayName: identity.username } };
  },
});

function headers(token: string) {
  return {
    Authorization: `Discogs token=${token}`,
    "User-Agent": userAgent,
    Accept: "application/vnd.discogs.v2.discogs+json",
    "Content-Type": "application/json",
  };
}

type Params = Record<string, string | number | boolean | undefined>;
type Fetch = typeof fetch;

const seg = encodeURIComponent;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    const qs = search.toString();
    const response = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: headers(token),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

const page = { page: number().optional(), perPage: number().optional() };
const paging = (i: { page?: number; perPage?: number }): Params => ({ page: i.page, per_page: i.perPage });
const sorting = { sort: string().optional(), sortOrder: string().optional() };
const sort = (i: { sort?: string; sortOrder?: string }): Params => ({ sort: i.sort, sort_order: i.sortOrder });

type Call = ReturnType<typeof client>;

function build(call: Call) {
  return router({
    identity: query(
      { description: "Return the authenticated user's id, username and resource URL.", input: object({}) },
      async () => call("GET", "/oauth/identity"),
    ),
    database: router(
      {
        search: query(
          {
            description:
              "Search the Discogs database. type is release, master, artist or label. Supply at least one of query or a field filter (title, releaseTitle, artist, label, genre, style, country, year, format, catno, barcode, track). Authenticated requests are required for search.",
            input: object({
              query: string().optional(),
              type: string().optional(),
              title: string().optional(),
              releaseTitle: string().optional(),
              artist: string().optional(),
              label: string().optional(),
              genre: string().optional(),
              style: string().optional(),
              country: string().optional(),
              year: string().optional(),
              format: string().optional(),
              catno: string().optional(),
              barcode: string().optional(),
              track: string().optional(),
              ...page,
            }),
          },
          async (_c, i) =>
            call("GET", "/database/search", {
              q: i.query,
              type: i.type,
              title: i.title,
              release_title: i.releaseTitle,
              artist: i.artist,
              label: i.label,
              genre: i.genre,
              style: i.style,
              country: i.country,
              year: i.year,
              format: i.format,
              catno: i.catno,
              barcode: i.barcode,
              track: i.track,
              ...paging(i),
            }),
        ),
        getRelease: query(
          {
            description: "Get a release by id. currAbbr optionally converts marketplace prices (USD, GBP, EUR, CAD, AUD, JPY, CHF, MXN, BRL, NZD, SEK, ZAR).",
            input: object({ releaseId: number(), currAbbr: string().optional() }),
          },
          async (_c, i) => call("GET", `/releases/${i.releaseId}`, { curr_abbr: i.currAbbr }),
        ),
        getReleaseStats: query(
          { description: "Get how many users have a release in their collection and wantlist.", input: object({ releaseId: number() }) },
          async (_c, i) => call("GET", `/releases/${i.releaseId}/stats`),
        ),
        getCommunityRating: query(
          { description: "Get a release's community rating average and count.", input: object({ releaseId: number() }) },
          async (_c, i) => call("GET", `/releases/${i.releaseId}/rating`),
        ),
        getUserRating: query(
          { description: "Get a user's rating of a release.", input: object({ releaseId: number(), username: string() }) },
          async (_c, i) => call("GET", `/releases/${i.releaseId}/rating/${seg(i.username)}`),
        ),
        setUserRating: mutation(
          {
            description: "Set the authenticated user's rating (1 to 5) of a release. username must be the authenticated user.",
            input: object({ releaseId: number(), username: string(), rating: number() }),
          },
          async (_c, i) => call("PUT", `/releases/${i.releaseId}/rating/${seg(i.username)}`, {}, { rating: i.rating }),
        ),
        deleteUserRating: mutation(
          {
            description: "Remove the authenticated user's rating of a release.",
            input: object({ releaseId: number(), username: string() }),
          },
          async (_c, i) => call("DELETE", `/releases/${i.releaseId}/rating/${seg(i.username)}`),
        ),
        getMaster: query(
          { description: "Get a master release by id.", input: object({ masterId: number() }) },
          async (_c, i) => call("GET", `/masters/${i.masterId}`),
        ),
        listMasterVersions: query(
          {
            description: "List the release versions of a master release. Optional filters: format, label, released (year), country.",
            input: object({
              masterId: number(),
              format: string().optional(),
              label: string().optional(),
              released: string().optional(),
              country: string().optional(),
              ...sorting,
              ...page,
            }),
          },
          async (_c, i) =>
            call("GET", `/masters/${i.masterId}/versions`, {
              format: i.format,
              label: i.label,
              released: i.released,
              country: i.country,
              ...sort(i),
              ...paging(i),
            }),
        ),
        getArtist: query(
          { description: "Get an artist by id.", input: object({ artistId: number() }) },
          async (_c, i) => call("GET", `/artists/${i.artistId}`),
        ),
        listArtistReleases: query(
          {
            description: "List the releases and masters credited to an artist. sort is year, title or format.",
            input: object({ artistId: number(), ...sorting, ...page }),
          },
          async (_c, i) => call("GET", `/artists/${i.artistId}/releases`, { ...sort(i), ...paging(i) }),
        ),
        getLabel: query(
          { description: "Get a label by id.", input: object({ labelId: number() }) },
          async (_c, i) => call("GET", `/labels/${i.labelId}`),
        ),
        listLabelReleases: query(
          { description: "List the releases on a label.", input: object({ labelId: number(), ...page }) },
          async (_c, i) => call("GET", `/labels/${i.labelId}/releases`, paging(i)),
        ),
      },
      { title: "Database", description: "Search and read releases, masters, artists and labels." },
    ),
    users: router(
      {
        getProfile: query(
          { description: "Get a user's profile.", input: object({ username: string() }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}`),
        ),
        updateProfile: mutation(
          {
            description: "Edit the authenticated user's profile. username must be the authenticated user. Supply only the fields to change.",
            input: object({
              username: string(),
              name: string().optional(),
              homePage: string().optional(),
              location: string().optional(),
              profile: string().optional(),
              currAbbr: string().optional(),
            }),
          },
          async (_c, i) =>
            call("POST", `/users/${seg(i.username)}`, {}, {
              name: i.name,
              home_page: i.homePage,
              location: i.location,
              profile: i.profile,
              curr_abbr: i.currAbbr,
            }),
        ),
        listSubmissions: query(
          { description: "List a user's database contributions.", input: object({ username: string(), ...page }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/submissions`, paging(i)),
        ),
        listContributions: query(
          { description: "List releases a user has contributed.", input: object({ username: string(), ...sorting, ...page }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/contributions`, { ...sort(i), ...paging(i) }),
        ),
      },
      { title: "Users", description: "User profiles and contributions." },
    ),
    collection: router(
      {
        listFolders: query(
          { description: "List a user's collection folders.", input: object({ username: string() }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/collection/folders`),
        ),
        getFolder: query(
          { description: "Get one collection folder.", input: object({ username: string(), folderId: number() }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/collection/folders/${i.folderId}`),
        ),
        createFolder: mutation(
          { description: "Create a collection folder.", input: object({ username: string(), name: string() }) },
          async (_c, i) => call("POST", `/users/${seg(i.username)}/collection/folders`, {}, { name: i.name }),
        ),
        renameFolder: mutation(
          {
            description: "Rename a collection folder (not folders 0 or 1).",
            input: object({ username: string(), folderId: number(), name: string() }),
          },
          async (_c, i) => call("POST", `/users/${seg(i.username)}/collection/folders/${i.folderId}`, {}, { name: i.name }),
        ),
        deleteFolder: mutation(
          { description: "Delete an empty collection folder.", input: object({ username: string(), folderId: number() }) },
          async (_c, i) => call("DELETE", `/users/${seg(i.username)}/collection/folders/${i.folderId}`),
        ),
        listItemsInFolder: query(
          {
            description: "List the releases in a collection folder. Folder 0 is All and always lists everything; folder 1 is Uncategorized. sort is label, artist, title, catno, format, rating, added or year.",
            input: object({ username: string(), folderId: number(), ...sorting, ...page }),
          },
          async (_c, i) =>
            call("GET", `/users/${seg(i.username)}/collection/folders/${i.folderId}/releases`, { ...sort(i), ...paging(i) }),
        ),
        listFoldersForRelease: query(
          { description: "List the collection folders that contain a release.", input: object({ username: string(), releaseId: number(), ...page }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/collection/releases/${i.releaseId}`, paging(i)),
        ),
        addRelease: mutation(
          {
            description: "Add a release to a collection folder (use folder 1 for Uncategorized). Returns the new instance id.",
            input: object({ username: string(), folderId: number(), releaseId: number() }),
          },
          async (_c, i) => call("POST", `/users/${seg(i.username)}/collection/folders/${i.folderId}/releases/${i.releaseId}`),
        ),
        moveOrRateInstance: mutation(
          {
            description: "Change the rating of a collection instance, or move it to another folder with newFolderId. Supply rating (1 to 5) and/or newFolderId.",
            input: object({
              username: string(),
              folderId: number(),
              releaseId: number(),
              instanceId: number(),
              rating: number().optional(),
              newFolderId: number().optional(),
            }),
          },
          async (_c, i) =>
            call(
              "POST",
              `/users/${seg(i.username)}/collection/folders/${i.folderId}/releases/${i.releaseId}/instances/${i.instanceId}`,
              {},
              { rating: i.rating, folder_id: i.newFolderId },
            ),
        ),
        removeInstance: mutation(
          {
            description: "Remove a release instance from a collection folder.",
            input: object({ username: string(), folderId: number(), releaseId: number(), instanceId: number() }),
          },
          async (_c, i) =>
            call("DELETE", `/users/${seg(i.username)}/collection/folders/${i.folderId}/releases/${i.releaseId}/instances/${i.instanceId}`),
        ),
        listCustomFields: query(
          { description: "List the custom fields a user defined for collection items.", input: object({ username: string() }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/collection/fields`),
        ),
        editInstanceField: mutation(
          {
            description: "Set a custom field value on a collection instance.",
            input: object({
              username: string(),
              folderId: number(),
              releaseId: number(),
              instanceId: number(),
              fieldId: number(),
              value: string(),
            }),
          },
          async (_c, i) =>
            call(
              "POST",
              `/users/${seg(i.username)}/collection/folders/${i.folderId}/releases/${i.releaseId}/instances/${i.instanceId}/fields/${i.fieldId}`,
              {},
              { value: i.value },
            ),
        ),
        getValue: query(
          { description: "Get the minimum, median and maximum value of a user's collection. Requires the authenticated user.", input: object({ username: string() }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/collection/value`),
        ),
      },
      { title: "Collection", description: "Collection folders, items, custom fields and value." },
    ),
    wantlist: router(
      {
        list: query(
          { description: "List the releases in a user's wantlist.", input: object({ username: string(), ...page }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/wants`, paging(i)),
        ),
        add: mutation(
          {
            description: "Add a release to the authenticated user's wantlist, with optional notes and rating (0 to 5).",
            input: object({ username: string(), releaseId: number(), notes: string().optional(), rating: number().optional() }),
          },
          async (_c, i) =>
            call("PUT", `/users/${seg(i.username)}/wants/${i.releaseId}`, {}, { notes: i.notes, rating: i.rating }),
        ),
        edit: mutation(
          {
            description: "Edit the notes or rating of a wantlist item.",
            input: object({ username: string(), releaseId: number(), notes: string().optional(), rating: number().optional() }),
          },
          async (_c, i) =>
            call("POST", `/users/${seg(i.username)}/wants/${i.releaseId}`, {}, { notes: i.notes, rating: i.rating }),
        ),
        remove: mutation(
          { description: "Remove a release from the authenticated user's wantlist.", input: object({ username: string(), releaseId: number() }) },
          async (_c, i) => call("DELETE", `/users/${seg(i.username)}/wants/${i.releaseId}`),
        ),
      },
      { title: "Wantlist", description: "Read and edit a wantlist." },
    ),
    lists: router(
      {
        listForUser: query(
          { description: "List a user's lists (public ones unless it is the authenticated user).", input: object({ username: string(), ...page }) },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/lists`, paging(i)),
        ),
        get: query(
          { description: "Get a list and its items by id.", input: object({ listId: number() }) },
          async (_c, i) => call("GET", `/lists/${i.listId}`),
        ),
      },
      { title: "Lists", description: "Read user-curated lists." },
    ),
    marketplace: router(
      {
        listInventory: query(
          {
            description: "List a user's marketplace inventory. status is For Sale, Draft, Expired, Sold or Deleted. sort is listed, price, item, artist, label, catno, audio or status.",
            input: object({ username: string(), status: string().optional(), ...sorting, ...page }),
          },
          async (_c, i) => call("GET", `/users/${seg(i.username)}/inventory`, { status: i.status, ...sort(i), ...paging(i) }),
        ),
        getListing: query(
          { description: "Get a marketplace listing by id.", input: object({ listingId: number(), currAbbr: string().optional() }) },
          async (_c, i) => call("GET", `/marketplace/listings/${i.listingId}`, { curr_abbr: i.currAbbr }),
        ),
        createListing: mutation(
          {
            description:
              "Create a marketplace listing. condition is one of Mint (M), Near Mint (NM or M-), Very Good Plus (VG+), Very Good (VG), Good Plus (G+), Good (G), Fair (F), Poor (P). status is For Sale or Draft. price is in the seller's currency.",
            input: object({
              releaseId: number(),
              condition: string(),
              sleeveCondition: string().optional(),
              price: number(),
              comments: string().optional(),
              allowOffers: string().optional(),
              status: string(),
              externalId: string().optional(),
              location: string().optional(),
              weight: number().optional(),
              formatQuantity: number().optional(),
            }),
          },
          async (_c, i) =>
            call("POST", "/marketplace/listings", {}, {
              release_id: i.releaseId,
              condition: i.condition,
              sleeve_condition: i.sleeveCondition,
              price: i.price,
              comments: i.comments,
              allow_offers: i.allowOffers === undefined ? undefined : i.allowOffers === "true",
              status: i.status,
              external_id: i.externalId,
              location: i.location,
              weight: i.weight,
              format_quantity: i.formatQuantity,
            }),
        ),
        editListing: mutation(
          {
            description: "Edit a marketplace listing. Supply only the fields to change; releaseId, condition, price and status are required by the API, so pass the current values.",
            input: object({
              listingId: number(),
              releaseId: number(),
              condition: string(),
              sleeveCondition: string().optional(),
              price: number(),
              comments: string().optional(),
              status: string(),
              location: string().optional(),
            }),
          },
          async (_c, i) =>
            call("POST", `/marketplace/listings/${i.listingId}`, {}, {
              release_id: i.releaseId,
              condition: i.condition,
              sleeve_condition: i.sleeveCondition,
              price: i.price,
              comments: i.comments,
              status: i.status,
              location: i.location,
            }),
        ),
        deleteListing: mutation(
          { description: "Permanently delete a marketplace listing.", input: object({ listingId: number() }) },
          async (_c, i) => call("DELETE", `/marketplace/listings/${i.listingId}`),
        ),
        listOrders: query(
          {
            description: "List the authenticated seller's orders. status filters by order status (for example New Order, Payment Received, Shipped). sort is id, buyer, created, status or last_activity.",
            input: object({ status: string().optional(), createdAfter: string().optional(), createdBefore: string().optional(), archived: string().optional(), ...sorting, ...page }),
          },
          async (_c, i) =>
            call("GET", "/marketplace/orders", {
              status: i.status,
              created_after: i.createdAfter,
              created_before: i.createdBefore,
              archived: i.archived,
              ...sort(i),
              ...paging(i),
            }),
        ),
        getOrder: query(
          { description: "Get a marketplace order by id.", input: object({ orderId: string() }) },
          async (_c, i) => call("GET", `/marketplace/orders/${seg(i.orderId)}`),
        ),
        editOrder: mutation(
          {
            description: "Change an order's status or shipping cost. Setting status moves the order along (for example Shipped).",
            input: object({ orderId: string(), status: string().optional(), shipping: number().optional() }),
          },
          async (_c, i) => call("POST", `/marketplace/orders/${seg(i.orderId)}`, {}, { status: i.status, shipping: i.shipping }),
        ),
        listOrderMessages: query(
          { description: "List the messages on an order.", input: object({ orderId: string(), ...page }) },
          async (_c, i) => call("GET", `/marketplace/orders/${seg(i.orderId)}/messages`, paging(i)),
        ),
        sendOrderMessage: mutation(
          {
            description: "Send a message to the other party of an order, optionally changing its status or shipping cost.",
            input: object({ orderId: string(), message: string().optional(), status: string().optional() }),
          },
          async (_c, i) => call("POST", `/marketplace/orders/${seg(i.orderId)}/messages`, {}, { message: i.message, status: i.status }),
        ),
        getFee: query(
          { description: "Calculate the marketplace fee for a price, optionally in a given currency (for example USD).", input: object({ price: number(), currency: string().optional() }) },
          async (_c, i) => call("GET", i.currency ? `/marketplace/fee/${i.price}/${seg(i.currency)}` : `/marketplace/fee/${i.price}`),
        ),
        getPriceSuggestions: query(
          { description: "Get suggested prices per condition for a release. Requires seller settings to be filled in.", input: object({ releaseId: number() }) },
          async (_c, i) => call("GET", `/marketplace/price_suggestions/${i.releaseId}`),
        ),
        getReleaseStats: query(
          { description: "Get marketplace statistics for a release: lowest price and number for sale.", input: object({ releaseId: number(), currAbbr: string().optional() }) },
          async (_c, i) => call("GET", `/marketplace/stats/${i.releaseId}`, { curr_abbr: i.currAbbr }),
        ),
      },
      { title: "Marketplace", description: "Inventory, listings, orders, fees and price suggestions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { discogs: discogs.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.discogs ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Discogs",
        description: "Search the Discogs music database and manage collections, wantlists, lists and marketplace listings and orders.",
        icons,
      },
    ),
  }),
);
