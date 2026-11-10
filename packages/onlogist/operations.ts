// ONLOGIST publishes its Transportation API as a RAML 1.0 document
// (https://dev.portal.onlogist.com/api/v1/transportation/doc), not OpenAPI, so these are the
// documented JSON endpoints. Binary and multipart endpoints (reports, receipt attachments, protocol
// images) are not covered. Writes are JSON bodies unless the description says to use query.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  readOnly?: boolean;
};

const reasons = "NO_LONGER_NEEDED, FAULTY_INPUT, OTHER_ORDER, PLACING_TOO_LONG, LOSS_OF_RENT, CAR_NOT_AVAILABLE, CAR_NOT_READY, CAR_EXECUTED";

export const operations: readonly Operation[] = [
  { group: "orders", name: "list", method: "GET", path: "/orders", description: "List orders in a status, 100 per page ordered by id. Query: status (NEW, IN_BUYNOW, IN_DIRECT, SCHEDULED, SCHEDULED_PENDING, ARRIVED, APPROVAL_REQUESTED, APPROVED, BILLING, SUBMITTED_FOR_BILLING, ARCHIVED, CANCELLED, ...; default IN_BUYNOW), page (from 1)." },
  { group: "orders", name: "get", method: "GET", path: "/orders/{uuid}", description: "Get an order by UUID with status, subStatus, price, service provider, mileage, fuel, price offers and receipts." },
  { group: "orders", name: "create", method: "POST", path: "/orders", description: "Create a transfer order. Body (required): vehicleType (CAR, CAR_E, VAN, VAN_E, TRUCK, TRUCK_E, TRUCK12, TRUCK12_E, TRAILER_COMPLETE), unitId, pickupTime, deliveryTime (ISO 8601, pickup before delivery), start and destination ({name, street, zip, city, country?, email?, phone?, sendMails?, secret?}), creator (email of a registered ONLOGIST user), costcenter ({code, name?}), transportType (STORE_ORDER, CUSTOMER_ORDER, FLEET_IN, FLEET_OUT, REPAIR_SHOP, GUARANTEE_ORDER, CROSS_BORDER, FINAL_DESTINATION). Optional: orderType (SINGLE, ROUNDTRIP, ROUNDTRIP_ABC, BUNDLE, TRAILER_ORDER), carSerial, orderNumber, price, comment, pickupTimeLatest, deliveryTimeEarliest, offerAsBuynow, endOfBuynow, approvalNeeded, dateScheduling, filledTank, carWash, licencePlateHandling, redLicencePlate, vehicle, bundleItems, trailerCars, roundtrip* fields, callbackUrl. Returns {uuid}." },
  { group: "orders", name: "createBulk", method: "POST", path: "/orders/bulk", description: "Create several orders at once. Body is a JSON array of order objects as in orders.create; pass it as body.items." },
  { group: "orders", name: "update", method: "PUT", path: "/orders/{uuid}", description: "Update an order in status IN_BUYNOW, SCHEDULED or SCHEDULED_PENDING_REJECTED. Price can only be raised while the order is in placing. Body: unitId, licencePlate, orderNumber, carSerial, price, start, destination, pickupTime, pickupTimeLatest, deliveryTime, deliveryTimeEarliest, message, attachment ({name, content (base64 PDF), hideInPlacing}), roundtrip* fields." },
  { group: "orders", name: "cancel", method: "DELETE", path: "/orders/{uuid}", description: "Cancel an order. Query: reason (" + reasons + "), emptyRide (true when the service provider is not at fault and the customer owes a share)." },
  { group: "orders", name: "getCancellationInfo", method: "GET", path: "/orders/{uuid}/cancellationinfo", description: "Get the fine and whether cancellation is possible for an order." },
  { group: "orders", name: "getStatuses", method: "POST", path: "/orders/status", readOnly: true, description: "Get info for several orders by UUID. Pass the JSON array of UUID strings as body.items." },
  { group: "orders", name: "markPaid", method: "POST", path: "/orders/paid", description: "Mark orders in status APPROVED as paid. Pass the JSON array of UUID strings as body.items." },
  { group: "orders", name: "cancelBatch", method: "POST", path: "/orders/batchcancel", description: "Try to cancel several orders. Query: reason (" + reasons + "). Pass the JSON array of UUID strings as body.items." },
  { group: "orders", name: "approve", method: "POST", path: "/orders/{uuid}/approve", description: "Approve an order and all its receipts for billing." },
  { group: "orders", name: "decline", method: "POST", path: "/orders/{uuid}/decline", description: "Decline an order and all its receipts for billing. Query: reason (required)." },
  { group: "orders", name: "undoUpdate", method: "POST", path: "/orders/{uuid}/update/undo", description: "Undo the last update of an order." },
  { group: "orders", name: "markArrived", method: "PUT", path: "/orders/{uuid}/arrived", description: "Mark an order arrived. An empty body marks it arrived; a body {price, reductionType (DELAYED, DAMAGE, MISC), reason} marks it arrived with price reduction and starts settlement." },
  { group: "orders", name: "complain", method: "POST", path: "/orders/{uuid}/complain", description: "File a complaint about an order. Query: description (why you are complaining)." },
  { group: "orders", name: "reportDamage", method: "POST", path: "/orders/{uuid}/damage", description: "Report damage on an order. Query: description (what happened)." },
  { group: "orders", name: "getLocation", method: "GET", path: "/orders/{uuid}/location", description: "Get the latest GPS location (lat, lon, timestamp) of the vehicle on a scheduled order." },
  { group: "orders", name: "getProtocolData", method: "GET", path: "/orders/{uuid}/protocol/{type}/data", description: "Get the data of a handover or takeover protocol. type is handover or takeover." },
  { group: "offers", name: "accept", method: "POST", path: "/orders/{uuid}/offers/{priceOfferId}/accept", description: "Accept a price offer on an order. Query: price (the offered price, as a double check)." },
  { group: "offers", name: "reject", method: "POST", path: "/orders/{uuid}/offers/{priceOfferId}/reject", description: "Reject a price offer on an order. Query: reason." },
  { group: "messages", name: "list", method: "GET", path: "/orders/{uuid}/messages", description: "List messages on a scheduled order." },
  { group: "messages", name: "send", method: "POST", path: "/orders/{uuid}/messages", description: "Send a message on a scheduled order. Query: message (required), internal (true to hide it from the service provider)." },
  { group: "messages", name: "deleteInternal", method: "DELETE", path: "/orders/{uuid}/messages/{messageId}", description: "Delete an internal order message." },
  { group: "ratings", name: "create", method: "POST", path: "/orders/{uuid}/ratings", description: "Rate an order. Query: type (SATISFACTION, CLEANLINESS, DRIVERMANNERS), score." },
  { group: "locations", name: "create", method: "POST", path: "/locations", description: "Create a location, or reuse an existing one with the exact same name and address. Body: name, street, zip, city (required), country, email, sendMails, secret, phone, latitude, longitude, notes. Returns {id}." },
  { group: "locations", name: "uploadCars", method: "POST", path: "/locations/{locationId}/cars", description: "Upload cars available at a location. Pass the JSON array as body.items; each item: availableFrom, unitId (required), freightNumber, category, carSerial, orderNumber, length." },
  { group: "costcenters", name: "create", method: "POST", path: "/costcenters", description: "Create a cost center. Body: code (required), name." },
  { group: "changes", name: "list", method: "GET", path: "/changes", description: "List changes to scheduled orders since a time; each entry has only the changed properties. Query: since (ISO 8601, e.g. 2019-11-14T10:00:00+01:00)." },
  { group: "qualifications", name: "list", method: "GET", path: "/qualifications", description: "List the calling customer's qualifications (id, name, type, max, defaultValue)." },
  { group: "invoices", name: "listMulti", method: "GET", path: "/multiinvoices", description: "List multi invoices with their invoices. Query: from, to (YYYY-MM-DD)." },
];
