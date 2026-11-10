import { accountRouter, defineApp, router, withApprovals, type RouterDeclaration } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter, type OpenapiToolNamesOptions } from "apps/openapi";
import { icons } from "./icon.js";
import { requirements } from "./provider.js";
import { curated } from "./curated.js";
import { addresses } from "./tools/shared.js";
// products/ holds copies of the single-product packages' sources (scripts/google-vendor.ts).
import { options as calendar } from "./products/calendar/openapi.js";
import { options as contacts } from "./products/contacts/openapi.js";
import * as docs from "./products/docs/tools.js";
import { options as drive } from "./products/drive/openapi.js";
import { options as forms } from "./products/forms/openapi.js";
import { options as gmail } from "./products/gmail/openapi.js";
import * as meet from "./products/meet/tools.js";
import { libraryOptions as photosLibrary, pickerOptions as photosPicker } from "./products/photos/openapi.js";
import { options as sheets } from "./products/sheets/openapi.js";
import * as slides from "./products/slides/tools.js";
import { options as tasks } from "./products/tasks/openapi.js";

const approve = <Query, Mutation>(tools: RouterDeclaration<Query, Mutation>) =>
  withApprovals(tools, (tool) => (tool.kind === "mutation" ? always() : undefined));

export default defineApp(
  { ...requirements, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        ...curated({
          accounts: user?.accounts.google ?? [],
          address: addresses.userinfo("https://www.googleapis.com/oauth2/v3/userinfo"),
          api: (product) => `api.${product}`,
        }),
        api: router(
          await accountRouter(
            user?.accounts.google ?? [],
            (account) => {
              const token = account.fields.access_token;
              const openapi = (options: OpenapiToolNamesOptions) =>
                approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account }));
              return router({
                gmail: router(openapi(gmail), {
                  title: "Gmail",
                  description: "Messages, threads, drafts, labels, history, filters, send-as aliases and settings.",
                }),
                calendar: router(openapi(calendar), {
                  title: "Google Calendar",
                  description: "Calendars, events, attendees, free/busy availability, sharing and settings.",
                }),
                drive: router(openapi(drive), {
                  title: "Google Drive",
                  description: "Files, folders, shared drives, permissions, comments, replies and revisions.",
                }),
                sheets: router(openapi(sheets), {
                  title: "Google Sheets",
                  description: "Spreadsheets, sheets, cell values, formatting and batch updates.",
                }),
                docs: router(approve(docs.tools(token, fetch, signal)), docs.meta),
                slides: router(approve(slides.tools(token, fetch, signal)), slides.meta),
                forms: router(openapi(forms), {
                  title: "Google Forms",
                  description: "Forms, questions, settings and responses.",
                }),
                tasks: router(openapi(tasks), {
                  title: "Google Tasks",
                  description: "Task lists and tasks.",
                }),
                contacts: router(openapi(contacts), {
                  title: "Google Contacts",
                  description: "Contacts, contact groups, other contacts and the Workspace directory (People API).",
                }),
                meet: router(approve(meet.tools(token, fetch, signal)), meet.meta),
                photos: router(
                  {
                    library: router(openapi(photosLibrary), {
                      title: "Google Photos Library",
                      description: "Albums and media items created by this app; uploads into the library.",
                    }),
                    picker: router(openapi(photosPicker), {
                      title: "Google Photos Picker",
                      description: "Picker sessions where the user selects photos, then the picked items.",
                    }),
                  },
                  { title: "Google Photos", description: "Google Photos Library and Picker APIs." },
                ),
              });
            },
            { signal },
          ),
          {
            title: "Google APIs",
            description:
              "The complete APIs of each Google product, per account: every tool takes accountId (from the top-level accounts tool) and the API's own input.",
          },
        ),
      },
      {
        title: "Google",
        description:
          "Every linked Google account across Gmail, Calendar, Drive, Sheets, Docs, Slides, Forms, Tasks, Contacts, Meet and Photos.",
        instructions:
          "Start with the top-level tools: search, gmail, calendar, drive, sheets, contacts and tasks read across every linked account at once unless `account` (an address) narrows them, and their results name the account each item came from. Pass that account to reads and writes of one item. Use api.<product> only for what the curated tools do not cover.",
        icons,
      },
    ),
  }),
);
