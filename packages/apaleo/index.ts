import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter, type OpenapiSourceOptions } from "apps/openapi";
import { icons } from "./icon.js";
import { areaOptions, areas, type Area } from "./openapi.ts";

const Account = object({ code: string(), name: string() });

const apaleo = defineProvider({
  name: "Apaleo",
  hosts: ["api.apaleo.com", "identity.apaleo.com"],
  auth: {
    // The OAuth app is created by the user in Apaleo's developer console (Apaleo Store > Connect app).
    oauth: oauth2({
      discover: "https://identity.apaleo.com",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "offline_access",
        "account.read",
        "properties.read",
        "properties.manage",
        "units.read",
        "units.manage",
        "unitgroups.read",
        "unitgroups.manage",
        "unitattributes.read",
        "unitattributes.manage",
        "reservations.read",
        "reservations.manage",
        "reservations.create",
        "reservations.assign-unit",
        "groups.read",
        "groups.manage",
        "groups.create",
        "blocks.read",
        "blocks.manage",
        "blocks.create",
        "companies.read",
        "companies.manage",
        "companies.create",
        "folios.read",
        "folios.manage",
        "invoices.read",
        "invoices.manage",
        "invoices.create",
        "charges.create",
        "payments.create",
        "refunds.create",
        "accounts.read",
        "accounting.read",
        "transactions.export",
        "routings.read",
        "routings.manage",
        "routings.create",
        "rateplans.read",
        "rateplans.manage",
        "rateplans.create",
        "rates.read",
        "rates.manage",
        "services.read",
        "services.manage",
        "services.create",
        "offers.read",
        "availability.read",
        "availability.manage",
        "maintenances.read",
        "maintenances.manage",
        "maintenances.create",
        "operations.change-room-state",
        "reports.read",
        "settings.read",
        "settings.manage",
        "setup.read",
        "logs.read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.apaleo.com/account/v1/accounts/current", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const current = await decodeJson(response, Account);
    return { accountInfo: { externalId: current.code, displayName: current.name } };
  },
});

const areaRouters = (deps: Pick<OpenapiSourceOptions, "cache" | "fetch" | "signal" | "account">) =>
  Object.fromEntries(
    (Object.keys(areas) as Area[]).map((area) => [
      area,
      router(liveOpenapiRouter({ ...areaOptions(area), ...deps }), {
        title: area[0]!.toUpperCase() + area.slice(1),
        description: areas[area],
      }),
    ]),
  ) as Record<Area, ReturnType<typeof router>>;

export default defineApp(
  { user: { accounts: { apaleo: apaleo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apaleo ?? [],
        (account) =>
          withApprovals(router(areaRouters({ cache, fetch, signal, account })), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Apaleo",
        description:
          "Apaleo property management: reservations, bookings, folios, invoices, inventory, rates, availability, operations and reports.",
        icons,
      },
    ),
  }),
);
