// Written from the operation pages at https://docs.stay.ai/reference (llms.txt index).
export type Operation = { group: string; name: string; method: "GET" | "POST" | "PUT" | "DELETE"; path: string; description: string };

export const operations: Operation[] = [
  {group: "subscriptions", name: "list", method: "GET", path: "/subscriptions", description: "Queries subscriptions. Query filters: email, status (ACTIVE, PAUSED, CANCELLED), createdAtMin/Max, updatedAtMin/Max, nextBillingDateMin/Max (epoch ms), isInDunning, page (from 1), pageSize (5-100), sortBy (createdAt or updatedAt), sortDirection (asc or desc)."},
  {group: "subscriptions", name: "get", method: "GET", path: "/subscriptions/{subscriptionId}", description: "Returns one subscription by id."},
  {group: "subscriptions", name: "create", method: "POST", path: "/subscriptions", description: "Creates a subscription."},
  {group: "subscriptions", name: "cancel", method: "POST", path: "/subscriptions/{subscriptionId}/cancel", description: "Cancels a subscription."},
  {group: "subscriptions", name: "change-frequency", method: "POST", path: "/subscriptions/{subscriptionId}/change-frequency", description: "Changes the billing frequency. Body: interval (integer), intervalUnit (day, week, month or year), optional initiator (MERCHANT or CUSTOMER)."},
  {group: "subscriptions", name: "set-shipping-address", method: "POST", path: "/subscriptions/{subscriptionId}/set-shipping-address", description: "Sets the shipping address of a subscription."},
  {group: "subscriptions", name: "update-order-notes", method: "PUT", path: "/subscriptions/{subscriptionId}/order-notes", description: "Updates the order notes of a subscription."},
  {group: "subscriptions", name: "add-meta-data", method: "POST", path: "/subscriptions/{subscriptionId}/meta-data", description: "Adds a meta data field to a subscription."},
  {group: "subscriptions", name: "generate-portal-link", method: "POST", path: "/subscriptions/generate-portal-link", description: "Generates a customer portal link. Body: email or phone of the customer."},
  {group: "lines", name: "update", method: "PUT", path: "/subscriptions/{subscriptionId}/lines/{lineId}", description: "Updates a subscription line. Body: price (number) and quantity (integer)."},
  {group: "lines", name: "remove", method: "POST", path: "/subscriptions/{subscriptionId}/remove-lines", description: "Removes lines from a subscription."},
  {group: "customers", name: "list", method: "GET", path: "/customers", description: "Queries customers. Query: page, pageSize, createdAtMin/Max, updatedAtMin/Max."},
  {group: "orders", name: "list", method: "GET", path: "/orders", description: "Queries orders. Query: createdAtMin/Max, updatedAtMin/Max, page, pageSize, sortBy, sortDirection."},
  {group: "catalog", name: "list", method: "GET", path: "/products/catalog", description: "Returns the product catalog. Query: page."},
  {group: "catalog", name: "get-product", method: "GET", path: "/products/{productId}", description: "Returns a product and its variants by Shopify product id."},
  {group: "selling-plan-groups", name: "list", method: "GET", path: "/selling-plan-groups", description: "Queries selling plan groups. Query: shopifySellingPlanGroupGId, shopifyProductGId, variantId."},
  {group: "selling-plan-groups", name: "get", method: "GET", path: "/selling-plan-groups/{sellingPlanGroupId}", description: "Returns one selling plan group."},
  {group: "selling-plan-groups", name: "create", method: "POST", path: "/selling-plan-groups", description: "Creates a selling plan group."},
  {group: "selling-plan-groups", name: "update", method: "PUT", path: "/selling-plan-groups/{sellingPlanGroupId}", description: "Updates a selling plan group."},
  {group: "settings", name: "get", method: "GET", path: "/settings", description: "Returns the account settings. Query: accountId."},
  {group: "webhooks", name: "list", method: "GET", path: "/webhooks", description: "Lists webhook subscriptions."},
  {group: "webhooks", name: "create", method: "POST", path: "/webhooks", description: "Creates a webhook subscription."},
  {group: "webhooks", name: "delete", method: "DELETE", path: "/webhooks/{webhookId}", description: "Deletes a webhook subscription."},
  {group: "data", name: "export", method: "POST", path: "/data/export", description: "Requests a data export. Body: type (SUBSCRIPTION, ORDER, RETENTION_ENGINE_SESSION, CUSTOMER_PORTAL_METRICS_BY_SUBSCRIPTION or FAILED_BILLING) and optional params {startDate, endDate}."},
];
