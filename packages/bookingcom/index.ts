import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// The Demand API sends every operation as POST. These are the read-only ones (searches, reference
// data, order previews and details, reading messages); everything else changes state and needs approval.
// orders.preview only prices the products passed in and does not reserve anything, per the vendor docs.
const readOnly = /^(accommodations|cars|commonLanguages|commonLocations|commonPayments|conversations)\.|^orders\.(preview|details\w*)$|^messages\.fetchLatestMessages$|^attachments\.(downloadMessageAttachment|getAttachmentMetadata)$/;

const bookingcom = defineProvider({
  name: "Booking.com",
  hosts: ["demandapi.booking.com"],
  auth: {
    apiKey: secrets({
      label: "Demand API token and affiliate ID",
      fields: object({ token: string({ minLength: 1 }), affiliateId: string({ minLength: 1 }) }),
    }),
  },
  // /common/languages is the lightest call; it needs both the token and the affiliate id and always
  // returns a data array.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://demandapi.booking.com/3.1/common/languages", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        "X-Affiliate-Id": account.fields.affiliateId,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) throw new Error(`Booking.com rejected the credentials (${response.status})`);
    await decodeJson(response, object({ data: array(object({ id: string() })) }));
  },
});

export default defineApp(
  { user: { accounts: { bookingcom: bookingcom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bookingcom ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" && !readOnly.test(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Booking.com",
        description:
          "Booking.com Demand API: search accommodations and car rentals, check availability and reviews, create and manage orders, and exchange messages with guests.",
        icons,
      },
    ),
  }),
);
