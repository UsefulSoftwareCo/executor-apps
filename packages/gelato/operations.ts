export type Host = "order" | "product" | "shipment" | "ecommerce";

export type Operation = {
  group: string;
  name: string;
  host: Host;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path with `{name}` placeholders, filled from params. */
  path: string;
  description: string;
  /** Names of required params (path parameters, query parameters or body fields). */
  required?: string[];
};

// Gelato API (https://dashboard.gelato.com/docs/). Gelato publishes no OpenAPI document, so the
// operations are written by hand from the vendor docs. Each API lives on its own subdomain.
export const operations: Operation[] = [
  { group: "orders", name: "create", host: "order", method: "POST", path: "/v4/orders", required: ["orderReferenceId", "customerReferenceId", "items", "shippingAddress"], description: "Create an order (orderType 'order') or a draft (orderType 'draft'). Body: orderReferenceId, customerReferenceId, currency, items [{itemReferenceId, productUid, files [{type, url}], quantity}], shipmentMethodUid, shippingAddress {firstName, lastName, companyName, addressLine1, addressLine2, city, postCode, state, country, email, phone}. A real order is charged and sent to production." },
  { group: "orders", name: "get", host: "order", method: "GET", path: "/v4/orders/{orderId}", required: ["orderId"], description: "Get an order with its items, status and shipment. Params: orderId." },
  { group: "orders", name: "search", host: "order", method: "POST", path: "/v4/orders:search", description: "Search orders. Body (all optional): channels, countries, currencies, financialStatuses, fulfillmentStatuses, orderTypes (arrays of strings), startDate, endDate (ISO 8601), limit, offset." },
  { group: "orders", name: "quote", host: "order", method: "POST", path: "/v4/orders:quote", required: ["orderReferenceId", "customerReferenceId", "recipient", "products"], description: "Quote an order's price and shipment options without creating it. Body: orderReferenceId, customerReferenceId, currency, recipient {firstName, lastName, addressLine1, city, postCode, state, country, email, phone}, products [{itemReferenceId, productUid, quantity}]." },
  { group: "orders", name: "convertDraft", host: "order", method: "PATCH", path: "/v4/orders/{orderId}", required: ["orderId", "orderType"], description: "Turn a draft order into a real order. Params: orderId, orderType ('order'). The order is charged and sent to production." },
  { group: "orders", name: "cancel", host: "order", method: "POST", path: "/v4/orders/{orderId}:cancel", required: ["orderId"], description: "Cancel an order that has not entered production. Params: orderId." },
  { group: "catalog", name: "listCatalogs", host: "product", method: "GET", path: "/v3/catalogs", description: "List product catalogs (for example cards, posters, apparel)." },
  { group: "catalog", name: "getCatalog", host: "product", method: "GET", path: "/v3/catalogs/{catalogUid}", required: ["catalogUid"], description: "Get a catalog and its product attributes with their possible values. Params: catalogUid." },
  { group: "catalog", name: "searchProducts", host: "product", method: "POST", path: "/v3/catalogs/{catalogUid}/products:search", required: ["catalogUid"], description: "Search products in a catalog by attribute values. Params: catalogUid. Body: attributeFilters (object of attribute name to array of values), limit, offset." },
  { group: "catalog", name: "getProduct", host: "product", method: "GET", path: "/v3/products/{productUid}", required: ["productUid"], description: "Get a product with its attributes and supported countries. Params: productUid." },
  { group: "catalog", name: "coverDimensions", host: "product", method: "GET", path: "/v3/products/{productUid}/cover-dimensions", required: ["productUid"], description: "Get cover dimensions of a book-like product. Params: productUid, optional pageCount (number of pages, for book-like products)." },
  { group: "catalog", name: "prices", host: "product", method: "GET", path: "/v3/products/{productUid}/prices", required: ["productUid"], description: "Get a product's prices by quantity. Params: productUid, optional country (ISO 3166-1 alpha-2), currency (ISO 4217), pageCount." },
  { group: "catalog", name: "stock", host: "product", method: "POST", path: "/v3/stock/region-availability", required: ["products"], description: "Check stock availability by region. Body: products (array of productUid strings)." },
  { group: "shipment", name: "listMethods", host: "shipment", method: "GET", path: "/v1/shipment-methods", description: "List shipment methods. Params: optional country (ISO 3166-1 alpha-2) to limit to methods available there." },
  { group: "store", name: "listProducts", host: "ecommerce", method: "GET", path: "/v1/stores/{storeId}/products", required: ["storeId"], description: "List products in an ecommerce store. Params: storeId, optional orderBy, order, limit, offset." },
  { group: "store", name: "getProduct", host: "ecommerce", method: "GET", path: "/v1/stores/{storeId}/products/{productId}", required: ["storeId", "productId"], description: "Get a store product. Params: storeId, productId." },
  { group: "store", name: "createProductFromTemplate", host: "ecommerce", method: "POST", path: "/v1/stores/{storeId}/products:create-from-template", required: ["storeId", "templateId"], description: "Create a store product from a template. Params: storeId. Body: templateId, title, description, isVisibleInTheOnlineStore, salesChannels, variants [{templateVariantId, imagePlaceholders [{name, fileUrl, fitMethod}]}]." },
  { group: "store", name: "getTemplate", host: "ecommerce", method: "GET", path: "/v1/templates/{templateId}", required: ["templateId"], description: "Get a product template with its variants and image placeholders. Params: templateId." },
];
