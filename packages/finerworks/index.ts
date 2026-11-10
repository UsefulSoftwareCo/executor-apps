import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.finerworks.com";

const finerworks = defineProvider({
  name: "FinerWorks",
  hosts: ["api.finerworks.com", "v2.api.finerworks.com"],
  auth: {
    // Both values come from the FinerWorks account page; FinerWorks offers no OAuth.
    apiKey: secrets({
      label: "API credentials",
      fields: object({ web_api_key: string({ minLength: 1 }), app_key: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v3/test_my_credentials`, {
      signal,
      headers: { web_api_key: account.fields.web_api_key, app_key: account.fields.app_key },
    });
    const result = await decodeJson(response, object({ status: object({ success: boolean() }) }));
    if (!result.status.success) throw new Error("FinerWorks rejected the credentials");
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(keys: { web_api_key: string; app_key: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        web_api_key: keys.web_api_key,
        app_key: keys.app_key,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Client = ReturnType<typeof client>;

const payload = record(json());

// GET endpoints take their parameters in the query string.
function read(c: Client, description: string, path: string, params: readonly string[]) {
  return query(
    { description, input: object(Object.fromEntries(params.map((name) => [name, string()]))) },
    async (_ctx, input: Params) => c("GET", path, input),
  );
}

// Read-only POST endpoints take a JSON body.
function post(c: Client, description: string, path: string) {
  return query({ description, input: object({ body: payload }) }, async (_ctx, input: Params) =>
    c("POST", path, {}, input.body as Params),
  );
}

function write(c: Client, method: "POST" | "PUT" | "DELETE", description: string, path: string) {
  return mutation({ description, input: object({ body: payload }) }, async (_ctx, input: Params) =>
    c(method, path, {}, input.body as Params),
  );
}

function build(c: Client) {
  return router({
    orders: router(
      {
        deletePendingOrders: write(c, "POST", "Removes orders from the temporary storage table. Body example: { \"ids\": [ 1, 2 ], \"account_key\": \"sample string 1\" }", "/v3/delete_pending_orders"),
        fetchOrderStatus: post(c, "Retrieves the current status of orders by order id or PO. Body example: { \"order_pos\": null, \"order_ids\": [ 123456, 123457 ], \"account_key\": null }", "/v3/fetch_order_status"),
        getOrder: read(c, "Retrieves a specific orders.", "/v3/get_order", ["order_guid", "order_email"]),
        listOrders: post(c, "Retrieves a list of orders. Body example: { \"search_filter\": \"sample string 1\", \"status\": \"sample string 2\", \"order_ids\": [ 1, 2 ], \"order_pos\": [ \"sample string 1\", \"sample string 2\" ], \"date_from\": \"2026-10-11T12:43:44.5530635-05:00\", \"date_to\": \"2026-10-11T12:43:44.5530635-05:00\", \"account_key\": \"sample string 3\", \"per_page\": 4, \"page_nu ...", "/v3/list_orders"),
        listPendingOrders: post(c, "Returns a list of orders being held in a pending status before being submitted. Body example: { \"ids\": [ 1, 2 ], \"skus\": [ \"sample string 1\", \"sample string 2\" ], \"account_key\": \"sample string 1\" }", "/v3/list_pending_orders"),
        listOrderStatusDefinitions: read(c, "Lists all available production status an order can have once it has completed. Use the id number for reference purposes since the descriptive value can be redundant or change wording in some cases.", "/v3/list_order_status_definitions", []),
        savePendingOrders: write(c, "POST", "Saves pending orders to a temporary storage table. This is useful if you want to make changes before final submission of an order. Body example: { \"orders\": [ { \"order_po\": \"sample string 1\", \"order_key\": \"c3036158-cd70-45bc-a8fd-1f51cc0fd61c\", \"guest\": true, \"shopping_cart_billing_info\": { \"first_name\": \"sample string 1\", \"last_name\": \"sample string 2\", \"company_name\": \"sample string 3\", \"address_1\": \"sample string 4\", \"address_2\": \"sample  ...", "/v3/save_pending_orders"),
        submitOrdersV2: write(c, "POST", "Submits a list of new orders (up to 50 at a time) which includes customer details (sender and recipient) as well as line item details and optional display fields for the packing slip. Once an order is successfully submitted it will return a confirmation (order reference id) and place the order into an accepted status and ultimately in our production queue. Body example: { \"orders\": [ { \"order_po\": \"PO_0001\", \"order_key\": null, \"guest\": false, \"recipient\": { \"first_name\": \"Bob\", \"last_name\": \"Ross\", \"company_name\": \"Happy Little Trees, Inc\", \"address_1\": \"742 Evergreen Terrace\", \"address_2\": null, \"address_3\": null, \"city\": \"Mountain Scene\", \"state_code\": \"AK\", \"pro ...", "/v3/submit_orders_v2"),
        updateOrder: write(c, "PUT", "Updates an existing submission order's status (note this is different than the production status).              You can change the submission status of an order with the api prior to it being placed in production. Once an order is in production you will need to contact our customer support team to make any further updates. Body example: { \"order_id\": 1234567, \"update_command\": \"hold\", \"account_key\": null }", "/v3/update_order"),
        submitNote: write(c, "POST", "Adds a note an order's log. Notes are for back reference purposes  only and are NOT used for outside communication instructions to the production department or customer service. Body example: { \"order_id\": 123456, \"subject\": \"Note to self\", \"message\": \"This was my very first sale.\" }", "/v3/submit_note"),
      },
      { title: "Orders", description: "Submit, list, update and track orders." },
    ),
    customers: router(
      {
        validateRecipientAddress: post(c, "Can be used to validate and test an address such as an order's recipient. Body example: { \"recipient\": { \"first_name\": \"Bob\", \"last_name\": \"Ross\", \"company_name\": \"Happy Little Trees, Inc\", \"address_1\": \"742 Evergreen Terrace\", \"address_2\": null, \"address_3\": null, \"city\": \"Mountain Scene\", \"state_code\": \"AK\", \"province\": null, \"zip_postal_code\": \"88888\", \"country_code\": \"us\", \"phone\": ...", "/v3/validate_recipient_address"),
        updateCustomer: write(c, "PUT", "Updates an existing order's customer (shipping information). Body example: { \"order_id\": 12345, \"customer_info\": { \"first_name\": \"Bob\", \"last_name\": \"Ross\", \"company_name\": \"Happy Little Trees, Inc\", \"address_1\": \"742 Evergreen Terrace\", \"address_2\": null, \"address_3\": null, \"city\": \"Mountain Scene\", \"state_code\": \"AK\", \"province\": null, \"zip_postal_code\": \"88888\", \"countr ...", "/v3/update_customer"),
      },
      { title: "Customers", description: "Validate and update recipient addresses." },
    ),
    images: router(
      {
        addUpdateGalleryCollection: write(c, "POST", "Add or update personal gallery collections setup in GeoGalleries.com. Body example: { \"id\": 1, \"name\": \"sample string 2\", \"description\": \"sample string 3\", \"visible\": true, \"account_key\": \"sample string 5\" }", "/v3/add_update_gallery_collection"),
        addImages: write(c, "POST", "Allows the user to add images to a library. Body example: { \"images\": [ { \"title\": \"My Cool Image\", \"description\": \"This is a really cool picture.\", \"file_name\": \"abc.jpg\", \"file_size\": 11000024, \"thumbnail_file_name\": \"thumbnail.jpg\", \"preview_file_name\": \"preview.jpg\", \"hires_file_name\": \"hires.jpg\", \"public_thumbnail_uri\": \"https://somewhere.com/public_ ...", "/v3/add_images"),
        deleteGalleryCollection: write(c, "DELETE", "Delete a personal gallery collection in GeoGalleries.com. Body example: { \"id\": 1, \"account_key\": \"sample string 2\" }", "/v3/delete_gallery_collection"),
        deleteImages: write(c, "DELETE", "Deletes a list of image files based on their unique id. Note if the image is assigned to the inventory library, this will also remove any virtual inventory products assigned to those images. Body example: { \"guids\": [ \"971581bc-725c-4c01-9669-184aa9d9186a\", \"fd055708-2247-44ee-af88-3575abc5e518\" ], \"library\": null, \"account_key\": null }", "/v3/delete_images"),
        listFileSelection: read(c, "Returns a list of currently selected files. The querystring parameter guid is the master key assigned to all files that are selected.", "/v3/list_file_selection", ["guid"]),
        listImages: post(c, "Provides a list of image files you have uploaded and any virtual inventory items assigned to them. Body example: { \"library\": { \"name\": \"inventory\", \"session_id\": \"1234567890\", \"account_key\": \"\", \"site_id\": 2 }, \"search_filter\": \"\", \"guid_filter\": null, \"personal_gallery_id_filter\": null, \"public_gallery_id_filter\": null, \"page_number\": 1, \"per_page\": 10, \"sort_field\": \"id\", \"sort_direction\": \"DESC\", \"upload_d ...", "/v3/list_images"),
        listPrintables: post(c, "Get a list of printable products available at FinerWorks. Body example: { \"ids\": [ 1, 2 ] }", "/v3/list_printables"),
        listGalleryThemes: post(c, "Returns a list of themes used in GeoGalleries. Body example: { \"filter\": [ \"sample string 1\", \"sample string 2\" ] }", "/v3/list_gallery_themes"),
        updateFileSelection: write(c, "PUT", "Updates a list of a users current selected image files based on the selection key. Body example: { \"guids\": [ \"649c85ea-4cab-4c81-92b4-63477a6d2c4a\", \"b1d1adda-f30a-41bd-a9b5-77482502f73a\" ], \"guid\": \"5679b678-2a16-4e0e-8a99-b1fca6b53a0f\" }", "/v3/update_file_selection"),
        updateImages: write(c, "PUT", "Updates a list of image files based on their unique id. Note if the image is assigned to the inventory library, this will also remove any virtual inventory products assigned to those images. Body example: { \"images\": [ { \"guid\": \"215fa466-fb33-4e81-93b3-95b6951f1ec0\", \"title\": \"My Cool Image\", \"description\": \"This is a very cool image.\", \"visible\": null, \"assigned_gallery_subcategory_ids\": null, \"assigned_personal_gallery_ids\": null, \"rank\": 0 } ], \"account_key\": null }", "/v3/update_images"),
        listGalleries: post(c, "List galleries setup in GeoGalleries.com. Body example: { \"account_key\": \"sample string 1\", \"personal\": true, \"gallery_ids\": [ 1, 2 ] }", "/v3/list_galleries"),
      },
      { title: "Images and galleries", description: "Image library, GeoGalleries and file selections." },
    ),
    framing: router(
      {
        frameBuilder: post(c, "This allows you to submit details to validate a framing option, get pricing and info as well as return base64 data you can use to display your frame package. Body example: { \"product_code\": null, \"config\": { \"frame_id\": 458, \"width\": 18.0, \"height\": 20.0, \"mats\": [ { \"id\": 1, \"windows\": [ { \"width\": 10.0, \"height\": 12.0, \"window_x\": 0.0, \"window_y\": 0.0, \"mat_image_to_display_url\": null } ] }, { \"id\": 2, \"windows\": [ { \"width\": 12.0, \"height\": 14.0, \"window_x\": 0.0, \" ...", "/v3/frame_builder"),
        frameDetails: post(c, "List the prints currently setup in your inventory. Body example: { \"id\": 1 }", "/v3/frame_details"),
        listGlazing: post(c, "Lists the available glazing / glass. Body example: { \"id\": 1 }", "/v3/list_glazing"),
        listCollections: post(c, "List all available frame categories. Body example: { \"id\": 1, \"product_code\": \"sample string 2\" }", "/v3/list_collections"),
        listMats: post(c, "Lists the available mats. Body example: { \"id\": 1 }", "/v3/list_mats"),
      },
      { title: "Framing", description: "Frames, mats, glazing and frame rendering." },
    ),
    products: router(
      {
        buildProductCode: post(c, "Create a product code based on a list of material ids. This is used for the product builder to build a product code that can be added to the cart. Note this endpoint does not check if the materials are active or valid for use, it simply builds a code based on the ids provided. Body example: { \"build\": { \"CardStockID\": 1, \"CardStyleID\": 2, \"CardTypeID\": 3, \"FrameID\": 4, \"FrameW\": 5.0, \"FrameH\": 6.0, \"SheetW\": 7.0, \"SheetH\": 8.0, \"MatID\": 9, \"Mat1WindowW\": 10.0, \"Mat1WindowH\": 11.0, \"MatID2\": 12, \"Mat2WindowW\": 13.0, \"Mat2WindowH\": 14.0, \"GlassID\": 15, \"PrintProductTypeID\": 16, \"MediaID\" ...", "/v3/build_product_code"),
        getPrices: post(c, "Returns a list of prices and their breakdown based on a list of product codes or virtual inventory skus. Request as few as 1 or as many as 50 in the body of the request. Body example: { \"products\": [ { \"product_qty\": 1, \"product_sku\": \"sample string 2\" }, { \"product_qty\": 1, \"product_sku\": \"sample string 2\" } ], \"account_key\": \"sample string 1\" }", "/v3/get_prices"),
        listMediaTypes: post(c, "Get a list of media types available at FinerWorks. Body example: { \"ids\": [ 1, 2 ], \"site_id\": 1 }", "/v3/list_media_types"),
        listProductTypes: post(c, "Get a list of product types available at FinerWorks. Body example: { \"ids\": [ 1, 2 ] }", "/v3/list_product_types"),
        listProducts: post(c, "Returns a list of products assigned to a particular order or cart. Body example: { \"guids\": [ \"7652624a-52e4-4b74-be92-a591303e92d7\", \"2b3f621b-a9cb-469e-96ba-c7dd987dde4f\" ], \"order_key\": \"b2a038f8-cc71-42de-a545-773abbde53bb\", \"account_key\": \"sample string 2\" }", "/v3/list_products"),
        listStaticProducts: post(c, "Returns a list of non-dynamic products. These are generally accessory products. Body example: { \"ids\": [ 1, 2 ], \"account_key\": \"sample string 1\" }", "/v3/list_static_products"),
        listStyleTypes: post(c, "Get a list of style types available at FinerWorks. Body example: { \"ids\": [ 1, 2 ] }", "/v3/list_style_types"),
        getProductDetails: post(c, "Request details and pricing (up to 25 skus at a time) based on sku and quantity. Additional response parameters may be added in the future as requested. Body example: { \"products\": [ { \"product_order_po\": \"sample string 1\", \"product_qty\": 2, \"product_sku\": \"sample string 3\", \"product_image\": { \"pixel_width\": 1, \"pixel_height\": 2, \"product_url_file\": \"sample string 3\", \"product_url_thumbnail\": \"sample string 4\", \"library_file\": { \"id\": 1, \"guid\": \"0902270a-918c-49 ...", "/v3/get_product_details"),
        submitProduct: write(c, "POST", "Adds a new product to virtual inventory or even to an existing shopping cart. Body example: { \"order_key\": \"643c5f49-1404-4d5b-849f-bc4acd789596\", \"cart_id\": 2.0, \"product\": { \"product_order_po\": \"sample string 1\", \"product_qty\": 2, \"product_sku\": \"sample string 3\", \"product_image\": { \"pixel_width\": 1, \"pixel_height\": 2, \"product_url_file\": \"sample string 3\", \"product_url_thumbnail\": \"samp ...", "/v3/submit_product"),
        validateProduct: post(c, "Used to validate a product to make sure the sku or product code is valid. Body example: { \"skus_or_codes\": [ \"sample string 1\", \"sample string 2\" ], \"account_key\": \"sample string 1\" }", "/v3/validate_product"),
        createTemplate: write(c, "POST", "Creates a template object from a product. Body example: { \"product\": { \"product_order_po\": \"sample string 1\", \"product_qty\": 2, \"product_sku\": \"sample string 3\", \"product_image\": { \"pixel_width\": 1, \"pixel_height\": 2, \"product_url_file\": \"sample string 3\", \"product_url_thumbnail\": \"sample string 4\", \"library_file\": { \"id\": 1, \"guid\": \"5b4fc375-c6a0-40e1- ...", "/v3/create_template"),
      },
      { title: "Products and pricing", description: "Product codes, media, types, pricing and validation." },
    ),
    inventory: router(
      {
        deleteVirtualInventory: write(c, "DELETE", "Deletes virtual inventory products. Note that if any of these items are synced with products on a 3rd party platform, those products will no longer be connected to FinerWorks. Body example: { \"skus\": [ \"AP0001P0001\", \"AP0001P0002\", \"AP0001P0003\", \"AP0001P0004\" ], \"account_key\": null }", "/v3/delete_virtual_inventory"),
        disconnectVirtualInventory: write(c, "PUT", "Updates ALL virtual inventory items by removing the 3rd party platform data specified in the request. To update SINGLE virtual inventory items, use the update_virtual_inventory endpoint instead. Body example: { \"platform\": \"sample string 1\", \"account_key\": \"sample string 2\" }", "/v3/disconnect_virtual_inventory"),
        listVirtualInventory: post(c, "Provides a list of a user's virtual inventory (products) stored in their account with valid product codes. Body example: { \"search_filter\": \"\", \"third_party_connections_filter\": null, \"sku_filter\": null, \"product_code_filter\": null, \"product_type_ids_filter\": null, \"guid_filter\": null, \"page_number\": 1, \"per_page\": 10, \"sort_field\": \"id\", \"sort_direction\": \"DESC\", \"created_date_from\": null, \"created_date_to\": null, \"a ...", "/v3/list_virtual_inventory"),
        updateVirtualInventory: write(c, "PUT", "Updates virtual inventory items within a user's account. Body example: { \"virtual_inventory\": [ { \"sku\": \"AP1556P79511\", \"asking_price\": 200.0, \"name\": \"Framed Giclee - Fine Art Paper Prints\", \"description\": \"&lt;ul&gt;&lt;ul&gt;&lt;li data-priority=\\\"0\\\" data-key=\\\"type\\\"&gt;Framed Giclee - Fine Art Paper Prints&lt;/li&gt;&lt;ul&gt;&lt;li data-priority=\\\"1\\\" data-key= ...", "/v3/update_virtual_inventory"),
      },
      { title: "Virtual inventory", description: "Reusable SKUs for items printed repeatedly." },
    ),
    shipping: router(
      {
        getShippingOptionsIds: read(c, "Lists all available shipping option ids. This does not return shipping rates but provides the ids for various shipping methods that can be used for cross reference purposes.              Sites should periodically check and update this data i case new shipping methods or added or deleted.", "/v3/get_shipping_options_ids", ["type"]),
        listShippingOptionsMultiple: post(c, "Submit a list of orders to get a list of available shipping options with the required shipping_code needed when submitting an order for each order. This endpoint should be requested under the following conditions.  Any changes to the recipient of an order,  a product is added or deleted from an order, the quantity of the any product changes. Body example: { \"orders\": [ { \"order_po\": \"PO_0001\", \"order_key\": null, \"guest\": false, \"recipient\": { \"first_name\": \"Bob\", \"last_name\": \"Ross\", \"company_name\": \"Happy Little Trees, Inc\", \"address_1\": \"742 Evergreen Terrace\", \"address_2\": null, \"address_3\": null, \"city\": \"Mountain Scene\", \"state_code\": \"AK\", \"pro ...", "/v3/list_shipping_options_multiple"),
      },
      { title: "Shipping", description: "Shipping option ids and rates." },
    ),
    account: router(
      {
        addUpdateAppKey: write(c, "POST", "Creates a new app_key for your account, or updates an existing app_key's name, description, and live/test mode when an app_key is provided. Body example: { \"id\": 1, \"app_key\": \"ba6ceb70-a593-4030-b1db-d4b5ab352a99\", \"name\": \"sample string 2\", \"description\": \"sample string 3\", \"live\": true, \"account_key\": \"sample string 5\" }", "/v3/add_update_app_key"),
        buyAccountCredits: write(c, "POST", "This does not automatically create an account credit in one's account.This adds it to one's shopping cart for later checkout. Only authorized accounts may use this endpoint. Body example: { \"amount\": 1.0, \"cart_id\": \"sample string 2\", \"extra_credits\": 3.0, \"account_key\": \"sample string 4\" }", "/v3/buy_account_credits"),
        creditTransaction: write(c, "POST", "Creates a credit transaction record for users in the account credits ledger. Only available to authorized users. Body example: { \"amount\": 1.0, \"memo\": \"sample string 2\", \"widthdrawal\": true, \"order_id\": 4, \"account_id\": 5 }", "/v3/credit_transaction"),
        deleteAppKey: write(c, "DELETE", "Permanently deletes an app_key from your account. This cannot be undone. Body example: { \"app_key\": \"dafc1126-7b33-4cc7-a2c7-9cd66fdd8dd7\", \"account_key\": \"sample string 2\" }", "/v3/delete_app_key"),
        findPromoCode: post(c, "Used to get both gift cards balances and promo details. Only authorized accounts may use this endpoint. Body example: { \"code\": \"sample string 1\", \"email_address\": \"sample string 2\", \"account_key\": \"sample string 3\" }", "/v3/find_promo_code"),
        getCompanyInfo: read(c, "Use this to get essential information about FinerWorks.", "/v3/get_company_info", []),
        getPaymentTokens: read(c, "Get associated payment tokens of the user that can ONLY be used at FinerWorks for submitting orders.", "/v3/get_payment_tokens", ["payment_profile_id"]),
        getUser: read(c, "Must be authorized to use this endpoint.", "/v3/get_user", ["account_key"]),
        listInvoices: post(c, "Retrieves a list of invoices by month. Body example: { \"per_page\": 1, \"page_number\": 2, \"account_key\": \"sample string 3\" }", "/v3/list_invoices"),
        listPayments: post(c, "Retrieves a list of payments by month. Body example: { \"per_page\": 1, \"page_number\": 2, \"account_key\": \"sample string 3\" }", "/v3/list_payments"),
        testMyCredentials: read(c, "Use this for your first test and make sure your credentials are linked to your FinerWorks account information.", "/v3/test_my_credentials", []),
        updateAppDetails: write(c, "PUT", "Updates the details assigned to the app_key being used. Body example: { \"app_details\": { \"app_key\": \"sample string 1\", \"app_name\": \"sample string 2\", \"app_description\": \"sample string 3\", \"app_misc_data\": \"sample string 4\", \"app_live_mode\": true } }", "/v3/update_app_details"),
        updateAccountCredits: write(c, "PUT", "Used to get and add account credits to an account. Only authorized accounts may use this endpoint. Body example: { \"code\": \"sample string 1\", \"email_address\": \"sample string 2\", \"account_key\": \"sample string 3\" }", "/v3/update_account_credits"),
        updateUser: write(c, "PUT", "Updates various features of a users account which can be useful. Body example: { \"account_key\": \"sample string 1\", \"billing_info\": { \"first_name\": \"sample string 1\", \"last_name\": \"sample string 2\", \"company_name\": \"sample string 3\", \"address_1\": \"sample string 4\", \"address_2\": \"sample string 5\", \"address_3\": \"sample string 6\", \"city\": \"sample string 7\", \"state_code\": \"sample s ...", "/v3/update_user"),
      },
      { title: "Account and billing", description: "Credentials, app keys, credits, invoices, payments and profile." },
    ),
    activity: router(
      {
        addEvent: write(c, "POST", "Creates an event log entry that can be reviewed later for debugging purposes. This endpoint requires special permission to use. Body example: { \"id\": 1, \"type\": \"sample string 2\", \"name\": \"sample string 3\", \"details\": \"sample string 4\", \"account_id\": 5, \"site_id\": 6, \"date_time\": \"2026-10-11T12:43:22.4373173-05:00\" }", "/v3/add_event"),
        listEventLogs: post(c, "Provides a list of event logs. Requires special permissions to be able to use this endpoint. Body example: { \"type\": \"sample string 1\", \"search_term\": \"sample string 2\", \"page_number\": 3, \"per_page\": 4, \"sort_field\": \"sample string 5\", \"sort_direction\": \"sample string 6\" }", "/v3/list_event_logs"),
      },
      { title: "Activity log", description: "Event logs (requires special permission on the account)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { finerworks: finerworks.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.finerworks ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "FinerWorks",
        description:
          "Print-on-demand and custom framing fulfillment: orders, products and pricing, framing, shipping, image library and virtual inventory. POST and PUT tools take the endpoint's JSON as body; GET tools take query parameters directly.",
        icons,
      },
    ),
  }),
);
