// The curated tools: per-product routers from tools/ (copies of shared/google-tools, written by
// scripts/google-vendor.ts), plus the two tools that span products.
import { number, object, query, router, string, type RouterChild, type RouterOptions } from "apps";
import { calendar, listEvents } from "./tools/calendar.js";
import { drive, driveQuery, searchFiles } from "./tools/drive.js";
import { gmail, searchMail } from "./tools/gmail.js";
import { contacts, findPeople } from "./tools/people.js";
import { fanOut, linked, select, type Context, type Source } from "./tools/shared.js";
import { sheets } from "./tools/sheets.js";
import { tasks } from "./tools/tasks.js";

const day = 24 * 60 * 60 * 1000;

/** A product's curated tools as one router. */
const mount = <Query, Mutation>(product: {
  readonly tools: Readonly<Record<string, RouterChild<Query, Mutation>>>;
  readonly meta: RouterOptions;
}) =>
  router(product.tools, product.meta);

export const curated = (source: Source) => ({
  accounts: query(
    {
      description: "List the linked Google accounts by address. Tools that take `account` accept one of these addresses.",
      input: object({}),
    },
    async (ctx: Context) => ({
      accounts: (await linked(ctx, source)).map((target) => ({ email: target.email, accountId: target.account.id })),
    }),
  ),
  search: query(
    {
      description:
        "Search everything at once across every linked Google account (or one): mail (Gmail search syntax works), Drive files, calendar events from 90 days back to a year ahead, and contacts. Returns the top matches of each; follow up with the product's own tools.",
      input: object({ query: string({ minLength: 1 }), account: string().optional(), max: number().optional() }),
    },
    async (ctx: Context, input) => {
      const targets = await select(ctx, source, input.account);
      const max = Math.min(Math.max(input.max ?? 5, 1), 25);
      const now = Date.now();
      const [mail, files, events, people] = await Promise.all([
        searchMail(ctx, targets, input.query, max),
        // Gmail operators (from:, is:unread) mean nothing to Drive; search its words only.
        searchFiles(ctx, targets, driveQuery(input.query.replace(/\b[a-z_]+:\S+/gi, "").trim() || input.query, undefined), max),
        listEvents(ctx, targets, now - 90 * day, now + 365 * day, input.query),
        fanOut(targets, (target) => findPeople(ctx, target, input.query, max)),
      ]);
      return {
        mail: mail.threads,
        files: files.files,
        // Nearest to today first, whether past or upcoming.
        events: [...events.events].sort((a, b) => Math.abs(Date.parse(a.start) - now) - Math.abs(Date.parse(b.start) - now)).slice(0, max),
        people: people.items.slice(0, max),
        errors: [...mail.errors, ...files.errors, ...events.errors, ...people.errors],
      };
    },
  ),
  gmail: mount(gmail(source)),
  calendar: mount(calendar(source)),
  drive: mount(drive(source)),
  sheets: mount(sheets(source)),
  contacts: mount(contacts(source)),
  tasks: mount(tasks(source)),
});
