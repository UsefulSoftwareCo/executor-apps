import { accountRouter, array, defineApp, defineProvider, mutation, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const cronfree = defineProvider({
  name: "Cronfree Time Scheduler",
  hosts: ["login.cronfree.com"],
  auth: {
    apiKey: secrets({
      label: "License key",
      fields: object({ licenseKey: string({ minLength: 1 }) }),
    }),
  },
  // Cronfree documents no read-only endpoint, so there is no health check.
});

const selector = () => array(string({ minLength: 1 }));

export default defineApp(
  { user: { accounts: { cronfree: cronfree.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cronfree ?? [],
        (account) =>
          withApprovals(
            router({
              schedules: router(
                {
                  create: mutation(
                    {
                      description:
                        "Create a recurring schedule: Cronfree will POST to hookUrl at every time matched by the selectors. Use [\"-1\"] in a selector for 'every'. wdays: 0 (Sunday) to 6 (Saturday); months: 1 to 12; mdays: 1 to 31; hours: 0 to 23; minutes: 0 to 59. timezone is an IANA zone name such as America/New_York.",
                      input: object({
                        hookUrl: string({ minLength: 1 }),
                        wdays: selector(),
                        months: selector(),
                        mdays: selector(),
                        hours: selector(),
                        minutes: selector(),
                        timezone: string({ minLength: 1 }),
                      }),
                    },
                    async (_ctx, { timezone, ...schedule }) => {
                      // The docs list timezone as a string in prose but send it as a one-element array.
                      const response = await fetch("https://login.cronfree.com/zapier/schedule", {
                        method: "POST",
                        signal,
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify({ ...schedule, license_key: account.fields.licenseKey, timezone: [timezone] }),
                      });
                      const text = await response.text();
                      if (response.status < 200 || response.status >= 300) {
                        throw new Error(`Cronfree schedule create failed (${response.status})`);
                      }
                      try {
                        return JSON.parse(text);
                      } catch {
                        return { ok: true, response: text };
                      }
                    },
                  ),
                  remove: mutation(
                    {
                      description:
                        "Remove the Cronfree schedule that posts to hookUrl (POST /zapier/unschedule).",
                      input: object({ hookUrl: string({ minLength: 1 }) }),
                    },
                    async (_ctx, { hookUrl }) => {
                      const response = await fetch("https://login.cronfree.com/zapier/unschedule", {
                        method: "POST",
                        signal,
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify({ hookUrl, license_key: account.fields.licenseKey }),
                      });
                      const text = await response.text();
                      if (response.status < 200 || response.status >= 300) {
                        throw new Error(`Cronfree schedule remove failed (${response.status})`);
                      }
                      try {
                        return JSON.parse(text);
                      } catch {
                        return { ok: true, response: text };
                      }
                    },
                  ),
                },
                { title: "Schedules", description: "Recurring webhook schedules." },
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Cronfree Time Scheduler",
        description: "Create and remove recurring webhook schedules by weekday, month, day, hour, minute and timezone with Cronfree.",
        icons,
      },
    ),
  }),
);
