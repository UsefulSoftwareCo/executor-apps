import {
  accountRouter,
  array,
  boolean,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://iteratehq.com/api/v1";

// The API reference asks every request to carry a `v` parameter set to the implementation date.
const apiVersion = "20161231";

const withVersion = (path: string) => `${base}${path}${path.includes("?") ? "&" : "?"}v=${apiVersion}`;

const iterate = defineProvider({
  name: "Iterate",
  hosts: ["iteratehq.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing surveys is read-only and works for any valid key.
  async health({ account, fetch, signal }) {
    await request(fetch, account, signal, "/surveys");
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const enc = encodeURIComponent;

// Iterate reports some failures as a 200 response with an `errors` array.
const request = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  init: { method?: string; body?: unknown } = {},
) => {
  const response = await fetch(withVersion(path), {
    method: init.method ?? "GET",
    signal,
    headers: init.body === undefined ? headers(account) : { ...headers(account), "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const result = await decodeJson(response, json());
  const errors = (result as { errors?: unknown } | null)?.errors;
  if (Array.isArray(errors) && errors.length > 0) throw new Error(`Iterate error: ${JSON.stringify(errors)}`);
  return result;
};

const call = request;

const selectors = {
  emails: array(string()).optional(),
  externalIds: array(string()).optional(),
  userProperties: array(json()).optional(),
};

const selectorBody = ({ emails, externalIds, userProperties }: {
  emails?: readonly string[] | undefined;
  externalIds?: readonly string[] | undefined;
  userProperties?: readonly unknown[] | undefined;
}) => ({ email: emails, external_id: externalIds, user_properties: userProperties });

const iterateTools = (account: Account, signal: AbortSignal) =>
  router({
    listSurveys: query(
      {
        description:
          "List every survey the API key can access, with the survey id, company id (needed by the user tools), name, title, type, platform and questions.",
        input: object({}),
      },
      async ({ fetch }) => call(fetch, account, signal, "/surveys"),
    ),
    getSurvey: query(
      {
        description: "Get one survey's configuration and questions by survey id.",
        input: object({ surveyId: string() }),
      },
      async ({ fetch }, { surveyId }) => call(fetch, account, signal, `/surveys/${enc(surveyId)}`),
    ),
    getSurveyStats: query(
      {
        description:
          "Get aggregate statistics for a survey: total responses, users responded, sends and displays, and response rates.",
        input: object({ surveyId: string() }),
      },
      async ({ fetch }, { surveyId }) => call(fetch, account, signal, `/surveys/${enc(surveyId)}/stats`),
    ),
    listResponses: query(
      {
        description:
          "List individual responses for a survey, newest first, 100 per page. startDate and endDate are inclusive Unix timestamps. For the next page pass the page[cursor] value from the links.next URL as cursor.",
        input: object({
          surveyId: string(),
          startDate: number().optional(),
          endDate: number().optional(),
          cursor: string().optional(),
        }),
      },
      async ({ fetch }, { surveyId, startDate, endDate, cursor }) =>
        call(
          fetch,
          account,
          signal,
          `/surveys/${enc(surveyId)}/responses${search({ start_date: startDate, end_date: endDate, "page[cursor]": cursor })}`,
        ),
    ),
    listResponseGroups: query(
      {
        description:
          "List a survey's responses grouped by user (each group is one user's complete submission), newest first, 10 per page. For the next page pass the page[cursor] value from the links.next URL as cursor.",
        input: object({ surveyId: string(), cursor: string().optional() }),
      },
      async ({ fetch }, { surveyId, cursor }) =>
        call(fetch, account, signal, `/surveys/${enc(surveyId)}/response-groups${search({ "page[cursor]": cursor })}`),
    ),
    searchUsers: query(
      {
        description:
          "Look up one user in a company and get their survey participation. Use exactly one selector: email, externalId, or userPropertyName with userPropertyValue (the value's type must match the stored property type). companyId is the company_id on a survey.",
        input: object({
          companyId: string(),
          email: string().optional(),
          externalId: string().optional(),
          userPropertyName: string().optional(),
          userPropertyValue: json().optional(),
        }),
      },
      async ({ fetch }, { companyId, email, externalId, userPropertyName, userPropertyValue }) =>
        call(
          fetch,
          account,
          signal,
          `/companies/${enc(companyId)}/users/search${search({
            email,
            external_id: externalId,
            user_property_name: userPropertyName,
            user_property_value:
              userPropertyValue === undefined
                ? undefined
                : typeof userPropertyValue === "string"
                  ? userPropertyValue
                  : JSON.stringify(userPropertyValue),
          })}`,
        ),
    ),
    addRecipient: mutation(
      {
        description:
          "Queue one email recipient on a survey. Nothing is sent until sendSurvey is called without an email.",
        input: object({
          surveyId: string(),
          email: string(),
          firstName: string().optional(),
          lastName: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { surveyId, email, firstName, lastName }) =>
        call(fetch, account, signal, `/surveys/${enc(surveyId)}/users`, {
          method: "POST",
          body: { email, first_name: firstName, last_name: lastName },
        }),
    ),
    importRecipients: mutation(
      {
        description:
          "Bulk add email recipients to a survey without sending it. Returns duplicate, failure and success counts. The survey is sent when sendSurvey is called without an email.",
        input: object({
          surveyId: string(),
          users: array(object({ email: string(), first_name: string().optional(), last_name: string().optional() })),
        }),
        approval: always(),
      },
      async ({ fetch }, { surveyId, users }) =>
        call(fetch, account, signal, `/surveys/${enc(surveyId)}/import`, { method: "POST", body: { users } }),
    ),
    sendSurvey: mutation(
      {
        description:
          "Send an email survey. With email, it goes to that address only; without, it goes to every recipient added so far. Sending cannot be undone. delay is seconds to wait; date is a Unix timestamp up to 30 days out. customFields keys are saved as custom user fields (sent with the field_ prefix).",
        input: object({
          surveyId: string(),
          email: string().optional(),
          firstName: string().optional(),
          lastName: string().optional(),
          delay: number().optional(),
          date: number().optional(),
          customFields: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { surveyId, email, firstName, lastName, delay, date, customFields }) => {
        const fields: Record<string, unknown> = {};
        if (customFields !== null && typeof customFields === "object" && !Array.isArray(customFields)) {
          for (const [key, value] of Object.entries(customFields)) {
            fields[key.startsWith("field_") ? key : `field_${key}`] = value;
          }
        }
        return call(fetch, account, signal, `/surveys/${enc(surveyId)}/send`, {
          method: "POST",
          body: { email, first_name: firstName, last_name: lastName, delay, date, ...fields },
        });
      },
    ),
    anonymizeUser: mutation(
      {
        description:
          "Permanently remove one user's email and attributes while keeping their responses. includeResponseProperties also strips properties stored on the responses.",
        input: object({
          companyId: string(),
          userId: string(),
          includeResponseProperties: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { companyId, userId, includeResponseProperties }) =>
        call(
          fetch,
          account,
          signal,
          `/companies/${enc(companyId)}/users/${enc(userId)}/anonymize${search({ include_response_properties: includeResponseProperties })}`,
          { method: "POST" },
        ),
    ),
    bulkAnonymizeUsers: mutation(
      {
        description:
          "Permanently anonymize every user matching any of the given emails, external ids or user properties. Responses are kept. includeResponseProperties also strips properties stored on the responses.",
        input: object({
          companyId: string(),
          ...selectors,
          includeResponseProperties: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { companyId, includeResponseProperties, ...rest }) =>
        call(fetch, account, signal, `/companies/${enc(companyId)}/users/anonymize`, {
          method: "POST",
          body: { ...selectorBody(rest), include_response_properties: includeResponseProperties },
        }),
    ),
    deleteUserData: mutation(
      {
        description: "Permanently delete one user object and all of that user's responses. This cannot be undone.",
        input: object({ companyId: string(), userId: string() }),
        approval: always(),
      },
      async ({ fetch }, { companyId, userId }) =>
        call(fetch, account, signal, `/companies/${enc(companyId)}/users/${enc(userId)}/data`, { method: "DELETE" }),
    ),
    bulkDeleteUserData: mutation(
      {
        description:
          "Permanently delete every user matching any of the given emails, external ids or user properties, together with all their responses. This cannot be undone.",
        input: object({ companyId: string(), ...selectors }),
        approval: always(),
      },
      async ({ fetch }, { companyId, ...rest }) =>
        call(fetch, account, signal, `/companies/${enc(companyId)}/users/data`, {
          method: "DELETE",
          body: selectorBody(rest),
        }),
    ),
  });

export default defineApp({ user: { accounts: { iterate: iterate.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.iterate ?? [], (account) => iterateTools(account, signal), { signal }), {
    title: "Iterate",
    description:
      "Send Iterate surveys, manage recipients, read responses, response groups and stats, and anonymize or delete respondent data.",
    icons,
  }),
}));
