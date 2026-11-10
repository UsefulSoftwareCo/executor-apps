import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const User = object({ userId: number() });

// Every read_* and write_* scope in JobAdder's document, plus the broad read/write scopes the operations also require.
// partner_* scopes are for job board and UI-action partners and are left out.
const scopes = [
    "manage_candidate_custom",
    "manage_company_custom",
    "manage_contact_custom",
    "manage_job_custom",
    "manage_jobapplication_custom",
    "manage_placement_custom",
    "read",
    "read_candidate",
    "read_candidate_note",
    "read_company",
    "read_company_note",
    "read_contact",
    "read_contact_note",
    "read_events",
    "read_float",
    "read_folder",
    "read_interview",
    "read_job",
    "read_job_note",
    "read_jobad",
    "read_jobapplication",
    "read_jobapplication_note",
    "read_note",
    "read_opportunity",
    "read_opportunity_note",
    "read_placement",
    "read_placement_note",
    "read_requisition",
    "read_requisition_note",
    "read_submission",
    "read_user",
    "read_usergroup",
    "read_usertask",
    "write",
    "write_candidate",
    "write_candidate_note",
    "write_company",
    "write_company_note",
    "write_contact",
    "write_contact_note",
    "write_events",
    "write_folder",
    "write_interview",
    "write_job",
    "write_job_note",
    "write_jobad",
    "write_jobapplication",
    "write_jobapplication_note",
    "write_note",
    "write_opportunity",
    "write_opportunity_note",
    "write_placement",
    "write_placement_note",
    "write_requisition",
    "write_requisition_note",
    "write_sms",
    "write_usertask",
  "offline_access",
];

const jobadder = defineProvider({
  name: "JobAdder",
  hosts: ["api.jobadder.com", "id.jobadder.com"],
  auth: {
    // Apps are registered with JobAdder (developers.jobadder.com), so the connect page asks for the client.
    oauth: oauth2({
      discover: "https://id.jobadder.com",
      scopes,
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.jobadder.com/v2/users/current", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: String(me.userId) } };
  },
});

export default defineApp(
  { user: { accounts: { jobadder: jobadder.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jobadder ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "JobAdder",
        description:
          "Recruitment CRM and ATS: candidates, jobs, job ads, applications, placements, companies, contacts, notes, interviews and webhooks.",
        icons,
      },
    ),
  }),
);
