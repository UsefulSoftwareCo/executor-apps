// Acuity's reference (https://developers.acuityscheduling.com/reference/) publishes OpenAPI only
// embedded in each reference page (no single document URL), so these are the documented endpoints
// of the Scheduling API at https://acuityscheduling.com/api/v1. Writes are JSON bodies.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
};

export const operations: readonly Operation[] = [
  { group: "account", name: "getMe", method: "GET", path: "/me", description: "Get the authenticated account (name, email, timezone, plan, scheduling page)." },
  { group: "appointments", name: "list", method: "GET", path: "/appointments", description: "List appointments. Query: max (default 100), minDate, maxDate (YYYY-MM-DD), calendarID, appointmentTypeID, canceled (true for canceled), showall (true for canceled and scheduled), firstName, lastName, email, phone, field:ID (custom form field), excludeForms, direction (DESC or ASC)." },
  { group: "appointments", name: "get", method: "GET", path: "/appointments/{id}", description: "Get one appointment by id. Query: pastFormAnswers (true to include previous form answers)." },
  { group: "appointments", name: "create", method: "POST", path: "/appointments", description: "Create an appointment. Body: datetime (required, ISO 8601), appointmentTypeID (required), firstName (required), lastName (required), email (required), calendarID, phone, certificate, notes, fields (array of {id, value}), smsOptIn, labels (array of {id}), addonIDs. Query: admin (true to bypass availability/required-field checks), noEmail (true to skip emails)." },
  { group: "appointments", name: "update", method: "PUT", path: "/appointments/{id}", description: "Update an appointment's details. Body: firstName, lastName, phone, email, certificate, notes, fields (array of {id, value}), labels (array of {id}), smsOptIn. Query: admin, noEmail." },
  { group: "appointments", name: "cancel", method: "PUT", path: "/appointments/{id}/cancel", description: "Cancel an appointment. Body: cancelNote. Query: admin (true to cancel regardless of policy), noEmail, noShow (true to mark as no-show)." },
  { group: "appointments", name: "reschedule", method: "PUT", path: "/appointments/{id}/reschedule", description: "Reschedule an appointment. Body: datetime (required, ISO 8601), calendarID, scheduleNotes. Query: admin, noEmail." },
  { group: "appointments", name: "listPayments", method: "GET", path: "/appointments/{id}/payments", description: "List payment transactions for an appointment." },
  { group: "appointmentTypes", name: "list", method: "GET", path: "/appointment-types", description: "List appointment types (id, name, duration, price, category, calendarIDs, private, type: service or class). Query: includeDeleted (true)." },
  { group: "appointmentTypes", name: "listAddons", method: "GET", path: "/appointment-addons", description: "List appointment add-ons that can be attached to appointments." },
  { group: "availability", name: "listDates", method: "GET", path: "/availability/dates", description: "List dates with open slots for an appointment type. Query: month (YYYY-MM, required), appointmentTypeID (required), calendarID, timezone, addonIDs." },
  { group: "availability", name: "listTimes", method: "GET", path: "/availability/times", description: "List open time slots on a date. Query: date (YYYY-MM-DD, required), appointmentTypeID (required), calendarID, ignoreAppointmentIDs, timezone, addonIDs." },
  { group: "availability", name: "listClasses", method: "GET", path: "/availability/classes", description: "List open class (group) sessions. Query: appointmentTypeID, calendarID, includeUnavailable, month, minDate, maxDate, timezone." },
  { group: "availability", name: "checkTimes", method: "POST", path: "/availability/check-times", description: "Check that a time slot is still available. Body: datetime (required), appointmentTypeID (required), calendarID. Read-only despite using POST." },
  { group: "blocks", name: "list", method: "GET", path: "/blocks", description: "List blocked-off time. Query: max, minDate, maxDate, calendarID." },
  { group: "blocks", name: "get", method: "GET", path: "/blocks/{id}", description: "Get one block by id." },
  { group: "blocks", name: "create", method: "POST", path: "/blocks", description: "Block off time on a calendar. Body: start (required, ISO 8601), end (required), calendarID (required), notes, description." },
  { group: "blocks", name: "delete", method: "DELETE", path: "/blocks/{id}", description: "Delete a block." },
  { group: "calendars", name: "list", method: "GET", path: "/calendars", description: "List the account's calendars (id, name, email, timezone, location, description)." },
  { group: "clients", name: "list", method: "GET", path: "/clients", description: "List clients. Query: search (matches name, email or phone)." },
  { group: "clients", name: "create", method: "POST", path: "/clients", description: "Create a client. Body: firstName (required), lastName (required), email, phone, notes." },
  { group: "clients", name: "update", method: "PUT", path: "/clients", description: "Update a client, identified by the query parameters firstName, lastName and phone (current values). Body: firstName, lastName, email, phone, notes." },
  { group: "clients", name: "delete", method: "DELETE", path: "/clients", description: "Delete a client, identified by the query parameters firstName, lastName and phone." },
  { group: "forms", name: "list", method: "GET", path: "/forms", description: "List intake forms and their fields, with the appointment types each applies to." },
  { group: "labels", name: "list", method: "GET", path: "/labels", description: "List appointment labels (id, name, color)." },
  { group: "products", name: "list", method: "GET", path: "/products", description: "List products, packages, gift codes and subscriptions sold." },
  { group: "products", name: "listOrders", method: "GET", path: "/orders", description: "List product orders. Query: max, minDate, maxDate, email." },
  { group: "products", name: "getOrder", method: "GET", path: "/orders/{id}", description: "Get one product order by id." },
  { group: "certificates", name: "check", method: "GET", path: "/certificates/check", description: "Validate a package, coupon or gift certificate code. Query: certificate (required), appointmentTypeID, email." },
  { group: "certificates", name: "list", method: "GET", path: "/certificates", description: "List issued package, gift and coupon certificates. Query: email." },
  { group: "webhooks", name: "list", method: "GET", path: "/webhooks", description: "List webhook subscriptions." },
  { group: "webhooks", name: "create", method: "POST", path: "/webhooks", description: "Subscribe a webhook. Body: event (required: appointment.scheduled, appointment.rescheduled, appointment.canceled, appointment.changed or order.completed), target (required, https URL)." },
  { group: "webhooks", name: "delete", method: "DELETE", path: "/webhooks/{id}", description: "Delete a webhook subscription." },
];
