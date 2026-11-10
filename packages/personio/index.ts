import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  oauth2,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { areas } from "./openapi.js";

const personio = defineProvider({
  name: "Personio",
  hosts: ["api.personio.de"],
  auth: {
    // The scopes are fixed on the API credential in Personio; the token request omits `scope` to get all of them.
    machine: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.personio.de/v2/auth/token",
      scopes: [],
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
    }),
  },
  // Personio v2 has no current-user endpoint; listing one person needs only the persons read scope.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.personio.de/v2/persons?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    // `_data` is the list envelope Personio returns on every successful list response.
    await decodeJson(response, object({ _data: json() }));
    return { accountInfo: { externalId: "personio", displayName: "Personio" } };
  },
});

export default defineApp(
  { user: { accounts: { personio: personio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.personio ?? [],
        (account) => {
          const mount = (options: (typeof areas)[keyof typeof areas]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              absencePeriodApi: mount(areas.absencePeriodApi),
              attendancePeriodService: mount(areas.attendancePeriodService),
              costCenters: mount(areas.costCenters),
              credentialsServiceApi: mount(areas.credentialsServiceApi),
              documentsContract: mount(areas.documentsContract),
              employmentContract: mount(areas.employmentContract),
              employmentWriteApi: mount(areas.employmentWriteApi),
              jobs: mount(areas.jobs),
              orgManagementService: mount(areas.orgManagementService),
              orgUnits: mount(areas.orgUnits),
              payrollIntegrationsService: mount(areas.payrollIntegrationsService),
              personWriteApi: mount(areas.personWriteApi),
              personsServiceApi: mount(areas.personsServiceApi),
              recruitingService: mount(areas.recruitingService),
              reports: mount(areas.reports),
              webhooksConfigurationService: mount(areas.webhooksConfigurationService),
              workplaces: mount(areas.workplaces),
            },
            { title: "Personio", description: "Personio HR API v2." },
          );
        },
        { signal },
      ),
      {
        title: "Personio",
        description:
          "Personio HR. Persons and employments, absences, attendances, org units, cost centers, workplaces, documents, payroll, recruiting and jobs, reports and webhooks (API v2).",
        icons,
      },
    ),
  }),
);
