// Tasks tools shaped for agents: open tasks from every list of every linked account, and adding
// or completing one by plain fields.
import { boolean, mutation, object, query, string } from "apps";
import { always } from "apps/operations/approval";
import { defined, fanOut, google, select, single, type Context, type Source, type WriteContext } from "./shared.js";

const base = "https://tasks.googleapis.com/tasks/v1";
const account = string().optional();

/** The curated tools and their router's metadata; `source` names the package's accounts. */
export const tasks = (source: Source) => ({
  tools: {
    list: query(
      {
        description:
          "List tasks from every task list of every linked Google account (or one), open tasks only unless includeCompleted. Tasks with a due date come first, soonest first.",
        input: object({ account, includeCompleted: boolean().optional(), dueBefore: string().optional() }),
      },
      async (ctx: Context, input) => {
        const { items, errors } = await fanOut(await select(ctx, source, input.account), async (target) => {
          const { items: lists = [] } = await google(ctx, target, `${base}/users/@me/lists`, { search: { maxResults: 100 } });
          const perList = await Promise.all(
            (lists as { id: string; title: string }[]).map(async (list) => {
              const { items = [] } = await google(ctx, target, `${base}/lists/${encodeURIComponent(list.id)}/tasks`, {
                search: {
                  maxResults: 100,
                  showCompleted: input.includeCompleted ?? false,
                  showHidden: input.includeCompleted ?? false,
                  dueMax: input.dueBefore ? new Date(input.dueBefore).toISOString() : undefined,
                },
              });
              return (items as any[]).map((task) =>
                defined({
                account: target.email,
                listId: list.id,
                list: list.title,
                taskId: task.id as string,
                title: task.title as string,
                notes: task.notes as string | undefined,
                // Google stores only the date of a due time.
                due: (task.due as string | undefined)?.slice(0, 10),
                status: task.status as string,
                parent: task.parent as string | undefined,
                }),
              );
            }),
          );
          return perList.flat();
        });
        items.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
        return { tasks: items, errors };
      },
    ),
    add: mutation(
      {
        description: "Add a task. listId defaults to the account's default list; due is a date (2026-10-14).",
        input: object({ account, listId: string().optional(), title: string({ minLength: 1 }), notes: string().optional(), due: string().optional() }),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        const target = await single(ctx, source, input.account);
        const task = await google(ctx, target, `${base}/lists/${encodeURIComponent(input.listId ?? "@default")}/tasks`, {
          method: "POST",
          body: { title: input.title, notes: input.notes, due: input.due ? `${input.due.slice(0, 10)}T00:00:00.000Z` : undefined },
        });
        return defined({ account: target.email, taskId: task.id, title: task.title, due: task.due?.slice(0, 10) });
      },
    ),
    complete: mutation(
      {
        description: "Mark a task done, or open again with done set to false.",
        input: object({ account, listId: string({ minLength: 1 }), taskId: string({ minLength: 1 }), done: boolean().optional() }),
        approval: always(),
      },
      async (ctx: WriteContext, input) => {
        const target = await single(ctx, source, input.account);
        const done = input.done ?? true;
        const task = await google(ctx, target, `${base}/lists/${encodeURIComponent(input.listId)}/tasks/${encodeURIComponent(input.taskId)}`, {
          method: "PATCH",
          body: done ? { status: "completed" } : { status: "needsAction", completed: null },
        });
        return { account: target.email, taskId: task.id, title: task.title, status: task.status };
      },
    ),
  },
  meta: {
    title: "Google Tasks",
    description: "Tasks across every linked Google account.",
    instructions: `List management and moving tasks are under ${source.api("tasks")}.`,
  },
});
