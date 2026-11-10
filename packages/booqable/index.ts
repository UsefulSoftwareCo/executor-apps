import {
  accountRouter,
  header,
  t,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Booqable company lives on its own host: https://<company>.booqable.com.
const siteUrl = (company: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.booqable\.com)?\/?$/.exec(
    company.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <company> of <company>.booqable.com (letters, digits, hyphens).");
  return `https://${match[1]}.booqable.com`;
};

const Company = object({ data: object({ id: string() }) });

const booqable = defineProvider({
  name: "Booqable",
  hosts: ["*.booqable.com"],
  auth: {
    // Booqable access tokens are created per employee at <company>.booqable.com/employees/current
    // and sent as a Bearer token. Booqable documents no user-created OAuth apps.
    apiKey: secrets({
      label: "Access token",
      fields: object({
        company: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.company)}/api/4/companies/current`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const company = await decodeJson(response, Company);
    return { accountInfo: { externalId: company.data.id, displayName: account.fields.company } };
  },
});

type Row = [group: string, action: string, method: string, path: string, description: string];

// Booqable's API is JSON:API. Collections take filter[...], include, sort, fields[...] and page[number]/page[size].
const rows: Row[] = [
  ["authenticationMethods", "list", "GET", "/authentication_methods", "List authentication methods. How to fetch a list of authentication methods: A 200 status response looks like this:"],
  ["authenticationMethods", "get", "GET", "/authentication_methods/{id}", "Fetch an authentication method. How to fetch an authentication method: A 200 status response looks like this:"],
  ["authenticationMethods", "create", "POST", "/authentication_methods", "Create an authentication method. How to create a token authentication method: A 201 status response looks like this: How to create a single_use authentication method (with ES256 strategy): A 201 status response looks like this: How to create a single_use authentication method (with RS256 strategy): A 201 status response looks like this: How to create a single_use authentication method (with HS256 strategy): A 201 status response looks like this:"],
  ["authenticationMethods", "delete", "DELETE", "/authentication_methods/{id}", "Delete an authentication method. How to delete an authentication method: A 200 status response looks like this:"],
  ["availabilities", "list", "GET", "/availabilities", "Fetch availability for an order / Fetch availability for a product / Fetch time-based availability for a downtime / Fetch availability for a bundle. Variants are selected by the filter parameters; see Booqable's API reference (Fetch availability for an order/Fetch availability for a product/Fetch time-based availability for a downtime/Fetch availability for a bundle)."],
  ["availabilityBreakdowns", "list", "GET", "/availability_breakdowns", "Fetch an availability breakdown for a product / Fetch an availability breakdown for a product in an order. Variants are selected by the filter parameters; see Booqable's API reference (Fetch an availability breakdown for a product/Fetch an availability breakdown for a product in an order)."],
  ["barcodes", "list", "GET", "/barcodes", "List barcodes. How to fetch a list of barcodes: A 200 status response looks like this: How to find an owner by a barcode number: A 200 status response looks like this: How to find an owner by a barcode number containing a url: A 200 status response looks like this:"],
  ["barcodes", "get", "GET", "/barcodes/{id}", "Fetch a barcode. How to fetch a barcode: A 200 status response looks like this:"],
  ["barcodes", "create", "POST", "/barcodes", "Create a barcode. How to create a barcode: A 201 status response looks like this:"],
  ["barcodes", "update", "PUT", "/barcodes/{id}", "Update a barcode. How to update a barcode: A 200 status response looks like this:"],
  ["barcodes", "delete", "DELETE", "/barcodes/{id}", "Destroy a barcode. How to delete a barcode: A 200 status response looks like this:"],
  ["bundles", "list", "GET", "/bundles", "List bundles. How to fetch a list of bundles: A 200 status response looks like this:"],
  ["bundles", "search", "POST", "/bundles/search", "Search bundles. Use advanced search to make logical filter groups with and/or operators. How to search for bundles: A 200 status response looks like this:"],
  ["bundles", "get", "GET", "/bundles/{id}", "Fetch a bundle. How to fetch a bundle: A 200 status response looks like this:"],
  ["bundles", "create", "POST", "/bundles", "Create a bundle. How to create a bundle with bundle items: A 201 status response looks like this:"],
  ["bundles", "update", "PUT", "/bundles/{id}", "Update a bundle. How to update a bundle with bundle items: A 200 status response looks like this:"],
  ["bundles", "archive", "DELETE", "/bundles/{id}", "Archive a bundle. How to delete a bundle: A 200 status response looks like this:"],
  ["bundleItems", "list", "GET", "/bundle_items", "List bundle items. How to fetch a list of bundle items: A 200 status response looks like this:"],
  ["bundleItems", "get", "GET", "/bundle_items/{id}", "Fetch a bundle item. How to fetch a bundle item: A 200 status response looks like this:"],
  ["bundleItems", "create", "POST", "/bundle_items", "Create a bundle item. How to create a bundle item: A 201 status response looks like this:"],
  ["bundleItems", "update", "PUT", "/bundle_items/{id}", "Update a bundle item. How to update a bundle item: A 200 status response looks like this:"],
  ["bundleItems", "delete", "DELETE", "/bundle_items/{id}", "Delete a bundle item. How to delete a bundle item: A 200 status response looks like this:"],
  ["collections", "list", "GET", "/collections", "List collections. How to fetch collections: A 200 status response looks like this:"],
  ["collections", "get", "GET", "/collections/{id}", "Fetch a collection. How to fetch a single collection: A 200 status response looks like this:"],
  ["collections", "create", "POST", "/collections", "Create a collection. How to create a collection: A 201 status response looks like this:"],
  ["collections", "update", "PUT", "/collections/{id}", "Update a collection. How to update a collection: A 200 status response looks like this:"],
  ["collections", "delete", "DELETE", "/collections/{id}", "Delete a collection. To delete a collection make sure there are no nested collections anymore. How to delete a collection: A 200 status response looks like this:"],
  ["collectionItems", "list", "GET", "/collection_items", "List collection items. How to fetch collection items: A 200 status response looks like this:"],
  ["collectionItems", "create", "POST", "/collection_items", "Create a collection item. How to create a collection item: A 201 status response looks like this:"],
  ["collectionItems", "delete", "DELETE", "/collection_items/{id}", "Delete a collection item. How to delete a collection item: A 200 status response looks like this:"],
  ["collectionTrees", "create", "POST", "/collection_trees", "Update the tree. How to update the tree: A 201 status response looks like this:"],
  ["companies", "get", "GET", "/companies/current", "Fetch a company / Fetch subscription details. Variants are selected by the filter parameters; see Booqable's API reference (Fetch a company/Fetch subscription details)."],
  ["companies", "update", "PUT", "/companies/current", "Update a company. How to update a company: A 200 status response looks like this:"],
  ["countries", "list", "GET", "/countries", "List countries. How to fetch a list of countries: A 200 status response looks like this:"],
  ["coupons", "list", "GET", "/coupons", "List coupons. How to fetch a list of coupons: A 200 status response looks like this: How to filter coupons and request stats: A 200 status response looks like this:"],
  ["coupons", "get", "GET", "/coupons/{id}", "Fetch a coupon. How to fetch a coupon: A 200 status response looks like this: How to fetch a coupon with coupon items and linked items: A 200 status response looks like this:"],
  ["coupons", "create", "POST", "/coupons", "Create a coupon. How to create a coupon: A 201 status response looks like this: How to create a coupon for specific collections: A 201 status response looks like this:"],
  ["coupons", "update", "PUT", "/coupons/{id}", "Update a coupon. A coupon is updated in place. Only active and tag_list can be changed; all other attributes are immutable once the coupon is created. How to update a coupon's tags: A 200 status response looks like this: How to deactivate a coupon: A 200 status response looks like this:"],
  ["coupons", "archive", "DELETE", "/coupons/{id}", "Archive a coupon. How to archive a coupon: A 200 status response looks like this:"],
  ["customers", "list", "GET", "/customers", "List customers. How to fetch a list of customers: A 200 status response looks like this:"],
  ["customers", "search", "POST", "/customers/search", "Search customers. Use advanced search to make logical filter groups with and/or operators. How to search for customers: A 200 status response looks like this:"],
  ["customers", "get", "GET", "/customers/{id}", "Fetch a customer. How to fetch a customers: A 200 status response looks like this:"],
  ["customers", "create", "POST", "/customers", "Create a customer. How to create a customer: A 201 status response looks like this:"],
  ["customers", "update", "PUT", "/customers/{id}", "Update a customer. How to update a customer: A 200 status response looks like this:"],
  ["customers", "archive", "DELETE", "/customers/{id}", "Archive a customer. How to archive a customer: A 200 status response looks like this:"],
  ["defaultProperties", "list", "GET", "/default_properties", "List default properties. How to fetch a list of default properties: A 200 status response looks like this:"],
  ["defaultProperties", "get", "GET", "/default_properties/{id}", "Fetch a default property. How to fetch a default property: A 200 status response looks like this:"],
  ["defaultProperties", "create", "POST", "/default_properties", "Create a default property. How to create a default property and assign it to an owner: A 201 status response looks like this:"],
  ["defaultProperties", "update", "PUT", "/default_properties/{id}", "Update a default property. How to update a default property: A 200 status response looks like this:"],
  ["defaultProperties", "delete", "DELETE", "/default_properties/{id}", "Delete a default property. How to delete a default property: A 200 status response looks like this:"],
  ["deliveryDistanceCalculations", "list", "GET", "/delivery_distance_calculations", "Calculate delivery distances. How to fetch a list of delivery distance calculations: A 200 status response looks like this:"],
  ["depositHolds", "create", "POST", "/deposit_holds", "Create. Hold a deposit: A 201 status response looks like this:"],
  ["documents", "list", "GET", "/documents", "List documents. How to fetch a list of documents: A 200 status response looks like this:"],
  ["documents", "search", "POST", "/documents/search", "Search documents. Use advanced search to make logical filter groups with and/or operators. How to search for documents: A 200 status response looks like this:"],
  ["documents", "get", "GET", "/documents/{id}", "Fetch a document. How to fetch a documents: A 200 status response looks like this:"],
  ["documents", "create", "POST", "/documents", "Create a document. How to create a contract: A 201 status response looks like this:"],
  ["documents", "update", "PUT", "/documents/{id}", "Update a document. How to update a document: A 200 status response looks like this:"],
  ["documents", "archive", "DELETE", "/documents/{id}", "Archive a document. When archiving an invoice make sure delete_invoices permission is enabled. How to archive a document: A 200 status response looks like this:"],
  ["downtimes", "list", "GET", "/downtimes", "List downtimes. How to fetch a list of downtimes: A 200 status response looks like this:"],
  ["downtimes", "get", "GET", "/downtimes/{id}", "Fetch a downtime. How to fetch a downtime: A 200 status response looks like this:"],
  ["downtimes", "create", "POST", "/downtimes", "Create a downtime. How to create a downtime: A 200 status response looks like this:"],
  ["downtimes", "update", "PUT", "/downtimes/{id}", "Update a downtime. How to update a downtime: A 200 status response looks like this:"],
  ["emails", "list", "GET", "/emails", "List emails. How to fetch a list of emails: A 200 status response looks like this: How to fetch a list of emails for a specific order: A 200 status response looks like this:"],
  ["emails", "create", "POST", "/emails", "Create and sending an email. How to create and send an email: A 201 status response looks like this: How to create an email with document attachments: A 201 status response looks like this: How to create an email with document data for template variables: A 201 status response looks like this:"],
  ["emailTemplates", "list", "GET", "/email_templates", "List email templates. How to fetch a list of email templates: A 200 status response looks like this:"],
  ["emailTemplates", "get", "GET", "/email_templates/{id}", "Fetch an email template. How to fetch an email template: A 200 status response looks like this:"],
  ["emailTemplates", "create", "POST", "/email_templates", "Create an email template. How to create a email template: A 201 status response looks like this:"],
  ["emailTemplates", "update", "PUT", "/email_templates/{id}", "Update an email template. How to update an email template: A 200 status response looks like this: How to update a default email template: A 200 status response looks like this:"],
  ["emailTemplates", "delete", "DELETE", "/email_templates/{id}", "Delete an email template. How to delete a email template: A 200 status response looks like this:"],
  ["employees", "list", "GET", "/employees", "List employees. How to fetch a list of employees: A 200 status response looks like this:"],
  ["employees", "get", "GET", "/employees/{id}", "Fetch an employee. How to fetch a employee: A 200 status response looks like this:"],
  ["employees", "update", "PUT", "/employees/{id}", "Update an employee. How to update an employee: A 200 status response looks like this: How to de-activate an employee: A 200 status response looks like this: How to set permissions: A 200 status response looks like this:"],
  ["employeeInvitations", "create", "POST", "/employee_invitations", "Send invitations. How to create an invitation: A 201 status response looks like this: To re-send an invitation we supply the ID the employee for which the invitation was sent. Note that you can also update other fields.: A 201 status response looks like this:"],
  ["inventoryAvailabilities", "list", "GET", "/inventory_availabilities", "Fetch availability for a product / Fetch availability for multiple products / Fetch availability for a bundle. Variants are selected by the filter parameters; see Booqable's API reference (Fetch availability for a product/Fetch availability for multiple products/Fetch availability for a bundle)."],
  ["inventoryBreakdowns", "list", "GET", "/inventory_breakdowns", "List inventory breakdowns. How to fetch a breakdown of all items in stock: A 200 status response looks like this: How to fetch a breakdown of all expected items: A 200 status response looks like this: How to fetch a breakdown of all expired items: A 200 status response looks like this:"],
  ["inventoryLevels", "list", "GET", "/inventory_levels", "Fetch inventory levels for a product / Fetch inventory levels for a product for a specific location. Variants are selected by the filter parameters; see Booqable's API reference (Fetch inventory levels for a product/Fetch inventory levels for a product for a specific location)."],
  ["invoiceFinalizations", "create", "POST", "/invoice_finalizations", "Finalize invoice. Finalize a pro forma invoice: A 200 status response looks like this:"],
  ["invoiceRevisions", "create", "POST", "/invoice_revisions", "Revise invoice. Revise a finalized invoice: A 200 status response looks like this:"],
  ["itemPrices", "list", "GET", "/item_prices", "Calculate the price of products and/or bundles / Calculate detailed price for a bundle. Variants are selected by the filter parameters; see Booqable's API reference (Calculate the price of products and/or bundles/Calculate detailed price for a bundle)."],
  ["items", "list", "GET", "/items", "List items. How to fetch a list of items: A 200 status response looks like this:"],
  ["items", "search", "POST", "/items/search", "Search items. Use advanced search to make logical filter groups with and/or operators. How to search for items: A 200 status response looks like this:"],
  ["items", "get", "GET", "/items/{id}", "Fetch an item. How to fetch an item: A 200 status response looks like this:"],
  ["lines", "list", "GET", "/lines", "List lines. How to fetch a list of lines: A 200 status response looks like this:"],
  ["lines", "get", "GET", "/lines/{id}", "Fetch a line. How to fetch a line: A 200 status response looks like this:"],
  ["lines", "create", "POST", "/lines", "Create a line. Lines created through this endpoint, so-called custom lines, can only have the type charge or section . Custom charge lines enable you to add charges not (directly) connected to a product to an order. Sections allow to add some organization to orders. Important: Lines created through this endpoint do not allocate inventory or affect product availability. To book products onto an order and reserve inventory, use the OrderFulfillment resource instead. Order totals are automatically re-calculated after the creation of a new line and an invoice sync will be triggered if changes are relevant. How t"],
  ["lines", "update", "PUT", "/lines/{id}", "Update a line. Change information, pricing, or increase the quantity of a line. Note that when updating the quantity of a line associated with a planning, the quantity of the planning will also be updated, which may result in a shortage error. Order totals are automatically re-calculated after updating a line and an invoice sync will be triggered if changes are relevant. How to update a line: A 200 status response looks like this:"],
  ["lines", "archive", "DELETE", "/lines/{id}", "Archive a line. How to delete a line: A 200 status response looks like this:"],
  ["lineChargeSuggestions", "list", "GET", "/line_charge_suggestions", "List suggestions. How to fetch a list of charge suggestions for a line: A 200 status response looks like this:"],
  ["locations", "list", "GET", "/locations", "List locations. How to fetch locations: A 200 status response looks like this:"],
  ["locations", "get", "GET", "/locations/{id}", "Fetch a location. How to fetch a single location: A 200 status response looks like this:"],
  ["locations", "create", "POST", "/locations", "Create a location. How to create a location: A 201 status response looks like this:"],
  ["locations", "update", "PUT", "/locations/{id}", "Update a location. How to update a location: A 200 status response looks like this:"],
  ["locations", "archive", "DELETE", "/locations/{id}", "Archive a location. To archive a location make sure that: There is no active stock at the location There are no running or future orders for this location This is not the last active location How to archive a location: A 200 status response looks like this: Failure due to a future order: A 422 status response looks like this: Failure due to active stock at location: A 422 status response looks like this:"],
  ["notes", "list", "GET", "/notes", "List notes. How to fetch a list of notes: A 200 status response looks like this:"],
  ["notes", "get", "GET", "/notes/{id}", "Fetch a note. How to fetch a note: A 200 status response looks like this:"],
  ["notes", "create", "POST", "/notes", "Create a note. How to create a note: A 201 status response looks like this:"],
  ["notes", "delete", "DELETE", "/notes/{id}", "Delete a note. How to delete a note: A 200 status response looks like this:"],
  ["orders", "list", "GET", "/orders", "List orders. How to fetch a list of orders: A 200 status response looks like this: How to filter orders by status: A 200 status response looks like this:"],
  ["orders", "search", "POST", "/orders/search", "Search orders. Use advanced search to make logical filter groups with and/or operators. How to search for orders: A 200 status response looks like this:"],
  ["orders", "new", "GET", "/orders/new", "New order. Returns an existing or new order for the current employee. How to fetch a new order: A 200 status response looks like this:"],
  ["orders", "get", "GET", "/orders/{id}", "Fetch an order. How to fetch an order: A 200 status response looks like this:"],
  ["orders", "create", "POST", "/orders", "Create an order. When creating an order it is possible to choose the initial status. Accepted statuses are new , draft and reserved . The created Order is empty (contains no products or other lines). To book products, stock items or bundles on an order, use the OrderFulfillment API. The draft status used to be named concept . This value is no longer supported. When the following attributes are not specified, a sensible default will be picked: deposit_type - From customer settings, or global default deposit type. deposit_value - From customer settings, or global default deposit type. discount_type - From custom"],
  ["orders", "update", "PUT", "/orders/{id}", "Update an order. When updating a customer on an order the following settings will be applied and prices will be calculated accordingly: discount_percentage deposit_type deposit_value tax_region_id How to assign a (new) customer to an order: A 200 status response looks like this: How to update the deposit_type: A 200 status response looks like this: Updating stops_at resulting in a shortage: A 422 status response looks like this:"],
  ["orderDeliveryRateRecalculations", "create", "POST", "/order_delivery_rate_recalculations", "Recalculate delivery rates. How to recalculate delivery rates: A 201 status response looks like this:"],
  ["orderDeliveryRates", "list", "GET", "/order_delivery_rates", "Fetch rates from all installed delivery apps for an order. How to fetch a list of rates: A 200 status response looks like this:"],
  ["orderDeliveryRates", "get", "GET", "/order_delivery_rates/{id}", "Fetch an order delivery rate. How to fetch a rate: A 200 status response looks like this:"],
  ["orderDeliveryRates", "create", "POST", "/order_delivery_rates", "Create an order delivery rate. How to create an order delivery rate: A 201 status response looks like this:"],
  ["orderDeliveryRates", "update", "PUT", "/order_delivery_rates/{id}", "Update an order delivery rate. How to update an order delivery rate: A 200 status response looks like this:"],
  ["orderDeliveryRates", "delete", "DELETE", "/order_delivery_rates/{id}", "Delete an order delivery rate. How to delete an order delivery rate: A 200 status response looks like this:"],
  ["orderFulfillments", "create", "POST", "/order_fulfillments", "Book / Specify / Start / Stop. Variants are selected by the filter parameters; see Booqable's API reference (Book/Specify/Start/Stop)."],
  ["orderPlanningAvailabilities", "list", "GET", "/order_planning_availabilities", "Get availability information for an order. Get availability for order with product: A 200 status response looks like this: Get availability for order with bundle: A 200 status response looks like this: Get availability for order without plannings: A 200 status response looks like this:"],
  ["orderPriceRecalculations", "create", "POST", "/order_price_recalculations", "Recalculate prices. Recalculate prices when rental period has changed: A 200 status response looks like this: Set a specific charge period for all items: A 200 status response looks like this:"],
  ["orderStatusTransitions", "create", "POST", "/order_status_transitions", "Transition. Save a new Order as draft: A 200 status response looks like this: Reserve a draft Order: A 200 status response looks like this: Reserve a draft Order, causing a blocking shortage error: A 422 status response looks like this: Reserve a draft Order, causing a shortage warning: A 422 status response looks like this: Reserve a draft Order, and override the shortage warning: A 200 status response looks like this: Reserve a draft Order, causing a stock item specified error: A 422 status response looks like this: Archive a reserved Order: A 422 status response looks like this: Archive a stopped Order"],
  ["payments", "list", "GET", "/payments", "List payments. How to fetch a list of payments: A 200 status response looks like this:"],
  ["payments", "get", "GET", "/payments/{id}", "Fetch a payment. How to fetch a payment: A 200 status response looks like this:"],
  ["paymentAuthorizations", "create", "POST", "/payment_authorizations", "Create a payment authorization. How to create a payment authorization: A 201 status response looks like this:"],
  ["paymentAuthorizations", "update", "PUT", "/payment_authorizations/{id}", "Update a payment authorization. How to update a payment authorization: A 200 status response looks like this:"],
  ["paymentCharges", "create", "POST", "/payment_charges", "Create a payment charge. How to create a payment charge: A 201 status response looks like this:"],
  ["paymentCharges", "update", "PUT", "/payment_charges/{id}", "Update a payment charge. How to update a payment charge: A 200 status response looks like this:"],
  ["paymentCharges", "delete", "DELETE", "/payment_charges/{id}", "Delete a payment charge. How to delete a payment charge: A 200 status response looks like this:"],
  ["paymentMethods", "list", "GET", "/payment_methods", "List payment methods. How to fetch a list of payment methods: A 200 status response looks like this:"],
  ["paymentMethods", "create", "POST", "/payment_methods", "Create a payment method. How to create a payment method: A 201 status response looks like this:"],
  ["paymentMethods", "delete", "DELETE", "/payment_methods/{id}", "Detach a payment method. How to detach a payment method from customer: A 200 status response looks like this:"],
  ["paymentRefunds", "create", "POST", "/payment_refunds", "Create a payment refund. How to create a payment refund: A 201 status response looks like this:"],
  ["paymentRefunds", "update", "PUT", "/payment_refunds/{id}", "Update a payment refund. How to update a payment refund: A 200 status response looks like this:"],
  ["paymentRefunds", "delete", "DELETE", "/payment_refunds/{id}", "Delete a payment refund. How to delete a payment refund: A 200 status response looks like this:"],
  ["photos", "list", "GET", "/photos", "List photos. How to fetch a list of photos: A 200 status response looks like this:"],
  ["photos", "get", "GET", "/photos/{id}", "Fetch a photo. How to fetch a photo: A 200 status response looks like this:"],
  ["photos", "create", "POST", "/photos", "Create a photo. How to create a photo: A 201 status response looks like this:"],
  ["photos", "update", "PUT", "/photos/{id}", "Update a photo. How to update a photo: A 200 status response looks like this:"],
  ["photos", "delete", "DELETE", "/photos/{id}", "Delete a photo. How to delete a photo: A 200 status response looks like this:"],
  ["plannings", "list", "GET", "/plannings", "List plannings. How to fetch a list of plannings: A 200 status response looks like this:"],
  ["plannings", "search", "POST", "/plannings/search", "Search plannings. Use advanced search to make logical filter groups with and/or operators. How to search for plannings: A 200 status response looks like this:"],
  ["plannings", "get", "GET", "/plannings/{id}", "Fetch a planning. How to fetch a planning: A 200 status response looks like this:"],
  ["priceRules", "create", "POST", "/price_rules", "Create a price rule. How to create a price rule: A 201 status response looks like this:"],
  ["priceRules", "update", "PUT", "/price_rules/{id}", "Update a price rule. How to update a price rule: A 200 status response looks like this: Updating a price rule: A 200 status response looks like this:"],
  ["priceRules", "archive", "DELETE", "/price_rules/{id}", "Archive a price rule. How to archive a price ruleset: A 200 status response looks like this:"],
  ["priceRulesets", "list", "GET", "/price_rulesets", "List price rulesets. How to fetch price rulesets: A 200 status response looks like this:"],
  ["priceRulesets", "get", "GET", "/price_rulesets/{id}", "Fetch a price ruleset. How to fetch a single price ruleset with related price rules: A 200 status response looks like this:"],
  ["priceRulesets", "create", "POST", "/price_rulesets", "Create a price ruleset. How to create a price ruleset with price rules: A 201 status response looks like this:"],
  ["priceRulesets", "update", "PUT", "/price_rulesets/{id}", "Update a price ruleset. How to update a price ruleset: A 200 status response looks like this: Updating a price ruleset's price rules: A 200 status response looks like this:"],
  ["priceRulesets", "archive", "DELETE", "/price_rulesets/{id}", "Archive a price ruleset. How to archive a price ruleset: A 200 status response looks like this:"],
  ["priceStructures", "list", "GET", "/price_structures", "List price structures. How to fetch a list of price structures: A 200 status response looks like this:"],
  ["priceStructures", "get", "GET", "/price_structures/{id}", "Fetch a price structure. How to fetch a price structure with it's tiles: A 200 status response looks like this:"],
  ["priceStructures", "create", "POST", "/price_structures", "Create a price structure. How to create a price structure with price tiles: A 201 status response looks like this:"],
  ["priceStructures", "update", "PUT", "/price_structures/{id}", "Update a price structure. How to update a price structure with price tiles: A 200 status response looks like this:"],
  ["priceStructures", "delete", "DELETE", "/price_structures/{id}", "Delete a price structure. How to delete a price structure with tax rates: A 200 status response looks like this:"],
  ["priceTiles", "list", "GET", "/price_tiles", "List price tiles. How to fetch a list of price tiles: A 200 status response looks like this:"],
  ["priceTiles", "get", "GET", "/price_tiles/{id}", "Fetch a price tile. How to fetch a price tile: A 200 status response looks like this:"],
  ["priceTiles", "create", "POST", "/price_tiles", "Create a price tile. How to create a price tile: A 201 status response looks like this:"],
  ["priceTiles", "update", "PUT", "/price_tiles/{id}", "Update a price tile. How to update a price tile: A 200 status response looks like this:"],
  ["priceTiles", "delete", "DELETE", "/price_tiles/{id}", "Delete a price tile. How to delete a price tile: A 200 status response looks like this:"],
  ["products", "list", "GET", "/products", "List products. How to fetch a list of products: A 200 status response looks like this:"],
  ["products", "search", "POST", "/products/search", "Search products. Use advanced search to make logical filter groups with and/or operators. How to search for products: A 200 status response looks like this:"],
  ["products", "get", "GET", "/products/{id}", "Fetch a product. How to fetch a product: A 200 status response looks like this:"],
  ["products", "create", "POST", "/products", "Create a product. How to create a product: A 201 status response looks like this:"],
  ["products", "update", "PUT", "/products/{id}", "Update a product. How to update a product: A 200 status response looks like this:"],
  ["products", "archive", "DELETE", "/products/{id}", "Archive a product. How to delete a product: A 200 status response looks like this:"],
  ["productGroups", "list", "GET", "/product_groups", "List product groups. How to fetch a list of product groups: A 200 status response looks like this:"],
  ["productGroups", "search", "POST", "/product_groups/search", "Search product groups. Use advanced search to make logical filter groups with and/or operators. How to search for product groups: A 200 status response looks like this:"],
  ["productGroups", "get", "GET", "/product_groups/{id}", "Fetch a product group. How to fetch a product group: A 200 status response looks like this:"],
  ["productGroups", "create", "POST", "/product_groups", "Create a product group. How to create a product group: A 201 status response looks like this:"],
  ["productGroups", "update", "PUT", "/product_groups/{id}", "Update a product group. How to update a product group: A 200 status response looks like this:"],
  ["productGroups", "archive", "DELETE", "/product_groups/{id}", "Archive a product group. How to delete a product group: A 200 status response looks like this:"],
  ["properties", "list", "GET", "/properties", "List properties. How to fetch a list of properties: A 200 status response looks like this:"],
  ["properties", "get", "GET", "/properties/{id}", "Fetch a property. How to fetch a property: A 200 status response looks like this:"],
  ["properties", "create", "POST", "/properties", "Create a property. How to create a property and assign it to an owner: A 201 status response looks like this:"],
  ["properties", "update", "PUT", "/properties/{id}", "Update a property. How to update a property: A 200 status response looks like this:"],
  ["properties", "delete", "DELETE", "/properties/{id}", "Delete a property. How to delete a property: A 200 status response looks like this:"],
  ["provinces", "list", "GET", "/provinces", "List provinces. How to fetch a list of provinces: A 200 status response looks like this:"],
  ["recommendations", "list", "GET", "/recommendations", "List recommendations. List recommendations for a product group: A 200 status response looks like this: List product groups recommending a given target: A 200 status response looks like this:"],
  ["recommendations", "create", "POST", "/recommendations", "Create a recommendation. Create a recommendation: A 201 status response looks like this:"],
  ["recommendations", "delete", "DELETE", "/recommendations/{id}", "Delete a recommendation. Delete a recommendation: A 200 status response looks like this:"],
  ["settings", "get", "GET", "/settings/current", "Fetch settings. How to fetch settings: A 200 status response looks like this:"],
  ["signatures", "get", "GET", "/signatures/{id}", "Sign a contract. The signature is finalized in the background, so the created signature has status pending . Poll the signature by fetching it ( GET /api/4/signatures/{id} ) until its status becomes completed or failed . The signed PDF is available as document_pdf_url . Confirm and add a signature to a contract: A 200 status response looks like this:"],
  ["sortings", "create", "POST", "/sortings", "Sort resources. How to update ordering of lines on an order: A 201 status response looks like this: How to update the order in which default properties are displayed: A 201 status response looks like this:"],
  ["stockAdjustments", "create", "POST", "/stock_adjustments", "Add stock (bulk) / Add stock (trackable) / Remove stock (bulk). Variants are selected by the filter parameters; see Booqable's API reference (Add stock (bulk)/Add stock (trackable)/Remove stock (bulk))."],
  ["stockCounts", "list", "GET", "/stock_counts", "List stock counts. List all stock counts for a product group: A 200 status response looks like this:"],
  ["stockCounts", "update", "PUT", "/stock_counts/{id}", "Update a stock count. Update purchase cost and date for a stock count: A 200 status response looks like this:"],
  ["stockItems", "list", "GET", "/stock_items", "List stock_items. How to fetch a list of stock items: A 200 status response looks like this:"],
  ["stockItems", "get", "GET", "/stock_items/{id}", "Fetch a stock_item. How to fetch a stock item: A 200 status response looks like this:"],
  ["stockItems", "create", "POST", "/stock_items", "Create a stock_item. How to create a stock item: A 201 status response looks like this:"],
  ["stockItems", "update", "PUT", "/stock_items/{id}", "Update a stock_item. How to update a stock item: A 200 status response looks like this:"],
  ["stockItemArchivations", "create", "POST", "/stock_item_archivations", "Archive. When the StockItem is not used, it can be archived: A 200 status response looks like this: When the StockItem was already archived: A 422 status response looks like this: When the StockItem is specified on a reserved Order: A 422 status response looks like this: When archival would create unallowed shortage: A 422 status response looks like this: When archival would create allowed shortage, but confirm_shortage is unspecified: A 422 status response looks like this: When archival would create allowed shortage, and confirm_shortage is true: A 200 status response looks like this:"],
  ["stockItemPlannings", "list", "GET", "/stock_item_plannings", "List stock item plannings. How to fetch a list of stock item plannings: A 200 status response looks like this:"],
  ["stockItemSuggestions", "list", "GET", "/stock_item_suggestions", "List stock item suggestions. Retrieve stock item suggestions for booking: A 200 status response looks like this:"],
  ["tags", "list", "GET", "/tags", "List tags. How to fetch a list of tags with their counts: A 200 status response looks like this:"],
  ["taxCategories", "list", "GET", "/tax_categories", "List tax categories. How to fetch a list of tax categories: A 200 status response looks like this:"],
  ["taxCategories", "get", "GET", "/tax_categories/{id}", "Fetch a tax category. How to fetch a tax categories with it's tax rates: A 200 status response looks like this:"],
  ["taxCategories", "create", "POST", "/tax_categories", "Create a tax category. How to create a tax category with tax rates: A 201 status response looks like this:"],
  ["taxCategories", "update", "PUT", "/tax_categories/{id}", "Update a tax category. How to update a tax category with tax rates: A 200 status response looks like this:"],
  ["taxCategories", "delete", "DELETE", "/tax_categories/{id}", "Delete a tax category. How to delete a tax category with tax rates: A 200 status response looks like this:"],
  ["taxRates", "list", "GET", "/tax_rates", "List tax rates. How to fetch a list of tax rates: A 200 status response looks like this:"],
  ["taxRates", "get", "GET", "/tax_rates/{id}", "Fetch a tax rate. How to fetch a tax rate: A 200 status response looks like this:"],
  ["taxRates", "create", "POST", "/tax_rates", "Create a tax rate. How to create a tax rate and associate it with an owner: A 201 status response looks like this:"],
  ["taxRates", "update", "PUT", "/tax_rates/{id}", "Update a tax rate. How to update a tax rate: A 200 status response looks like this:"],
  ["taxRates", "delete", "DELETE", "/tax_rates/{id}", "Delete a tax rate. How to delete a tax rate: A 200 status response looks like this:"],
  ["taxValues", "list", "GET", "/tax_values", "List tax values. How to fetch a list of tax values: A 200 status response looks like this:"],
  ["taxValues", "get", "GET", "/tax_values/{id}", "Fetch a tax value. How to fetch a tax value: A 200 status response looks like this:"],
  ["userInvitations", "create", "POST", "/user_invitations", "Re-invite a user. How to re-invite a user: A 201 status response looks like this:"],
  ["users", "list", "GET", "/users", "List users. How to fetch a list of users: A 200 status response looks like this: How to find users belonging to a customer: A 200 status response looks like this:"],
  ["users", "get", "GET", "/users/{id}", "Fetch a user. How to fetch a user: A 200 status response looks like this:"],
  ["users", "create", "POST", "/users", "Invite a user. How to invite a user: A 201 status response looks like this:"],
  ["users", "update", "PUT", "/users/{id}", "Update a user / Enable a user / Disable a user. Variants are selected by the filter parameters; see Booqable's API reference (Update a user/Enable a user/Disable a user)."],
  ["webhookEndpoints", "list", "GET", "/webhook_endpoints", "List webhook endpoints. How to fetch a list of webhook endpoints: A 200 status response looks like this:"],
  ["webhookEndpoints", "create", "POST", "/webhook_endpoints", "Subscribe to webhook events. How to subscribe to webhook events and receive v1 payloads: A 201 status response looks like this: How to subscribe to webhook events and receive v4 payloads: A 201 status response looks like this:"],
  ["webhookEndpoints", "update", "PUT", "/webhook_endpoints/{id}", "Update webhook events. How to update webhook events: A 200 status response looks like this:"],
  ["webhookEndpoints", "delete", "DELETE", "/webhook_endpoints/{id}", "Unsubscribe from webhook events. How to unsubscribe from webhook events: A 200 status response looks like this:"],
  ["webhooks", "get", "GET", "/webhooks/{id}", "Fetch a webhook. How to fetch a webhook (v1 format): A 200 status response looks like this: How to fetch a webhook (v4 format): A 200 status response looks like this:"],
];

const queryable = new Set(["GET"]);

function schemaFor(method: string, path: string) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  if (path.includes("{id}")) shape.id = string();
  if (method === "GET") {
    shape.filter = json().optional();
    shape.include = string().optional();
    shape.sort = string().optional();
    shape.fields = json().optional();
    shape.page_number = number().optional();
    shape.page_size = number().optional();
    shape.params = json().optional();
  } else if (method !== "DELETE") {
    shape.body = json();
  }
  return object(shape);
}

function describe(description: string, method: string, path: string): string {
  const params: string[] = [];
  if (path.includes("{id}")) params.push("- id (string, required): resource id (UUID)");
  if (method === "GET") {
    params.push(
      "- filter (json): filters, e.g. {\"status\":\"reserved\",\"starts_at\":{\"gte\":\"2026-01-01T00:00:00Z\"}}",
      "- include (string): comma-separated relationships to sideload, dot syntax for nesting, e.g. customer,lines.item",
      "- sort (string): comma-separated attributes; prefix with - for descending",
      "- fields (json): sparse fieldsets keyed by resource type, e.g. {\"orders\":\"starts_at,stops_at\"}",
      "- page_number (number), page_size (number)",
      "- params (json): any other query parameters, serialized as given (nested objects use bracket syntax)",
    );
  } else if (method !== "DELETE") {
    params.push(
      path.endsWith("/search")
        ? "- body (json, required): advanced search body, {\"filter\":{\"conditions\":{\"operator\":\"and\",\"attributes\":[...]}}}"
        : "- body (json, required): JSON:API document, {\"data\":{\"type\":\"<resource type>\",\"id\"?,\"attributes\":{...}}}",
    );
  }
  return params.length === 0 ? description : `${description}\n\nParameters:\n${params.join("\n")}`;
}

// Serializes nested values as filter[a][b]=c, the way JSON:API clients do.
function appendParam(search: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) search.set(key, value.map(String).join(","));
  else if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) appendParam(search, `${key}[${k}]`, v);
  } else search.set(key, String(value));
}

type Account = {
  fields: { company: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.company);

  const call = async (method: string, path: string, input: Record<string, unknown>) => {
    const url = path.replace("{id}", encodeURIComponent(String(input.id ?? "")));
    const search = new URLSearchParams();
    if (method === "GET") {
      appendParam(search, "filter", input.filter);
      appendParam(search, "fields", input.fields);
      appendParam(search, "include", input.include);
      appendParam(search, "sort", input.sort);
      if (input.page_number !== undefined) search.set("page[number]", String(input.page_number));
      if (input.page_size !== undefined) search.set("page[size]", String(input.page_size));
      if (typeof input.params === "object" && input.params !== null) {
        for (const [k, v] of Object.entries(input.params as Record<string, unknown>)) appendParam(search, k, v);
      }
    }
    const hasBody = input.body !== undefined && input.body !== null;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api/4${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Booqable answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, action, method, path, description] of rows) {
    const options = { description: describe(description, method, path), input: schemaFor(method, path) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, input);
    const tool = queryable.has(method) ? query(options, handler as never) : mutation(options, handler as never);
    const entry = groups.get(group) ?? {};
    entry[action] = tool;
    groups.set(group, entry);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { booqable: booqable.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.booqable ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Booqable",
        description:
          "Booqable rental software: orders, customers, products, bundles, stock, availability, pricing, payments, documents, locations, taxes, webhooks and settings.",
        icons,
      },
    ),
  }),
);
