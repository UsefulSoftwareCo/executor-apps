export type Operation = {
  group: string;
  name: string;
  method: "GET" | "PUT";
  path: string;
  description: string;
};

// Demio public API v1 (https://publicdemioapi.docs.apiary.io).
export const operations: Operation[] = [
  { group: "account", name: "ping", method: "GET", path: "/ping", description: "Check the API credentials. Returns { pong: true }." },
  { group: "events", name: "list", method: "GET", path: "/events", description: "List active (not canceled) events ordered by next session. Query: type (upcoming, past or automated)." },
  { group: "events", name: "get", method: "GET", path: "/event/{id}", description: "Get an event with its full list of sessions. Query: active (true to return only active dates in a series)." },
  { group: "events", name: "getSession", method: "GET", path: "/event/{id}/date/{dateId}", description: "Get one session (date) of an event." },
  { group: "events", name: "register", method: "PUT", path: "/event/register", description: "Register someone for an event and get their unique join link. Body: name and email (required); id or ref_url to pick the event; optional date_id (defaults to the nearest active date), last_name, company, website, phone_number, gdpr and custom field values." },
  { group: "reports", name: "participants", method: "GET", path: "/report/{dateId}/participants", description: "List participants of an event session. Query: status (attended, did not attend, completed, left early or banned)." },
];
