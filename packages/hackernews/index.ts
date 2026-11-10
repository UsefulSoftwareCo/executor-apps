import { decodeJson, defineApp, json, number, object, query, router, string } from "apps";
import { icons } from "./icon.js";

const firebase = "https://hacker-news.firebaseio.com/v0";
const algolia = "https://hn.algolia.com/api/v1";

// Both APIs are public and read-only, so the app declares no account.
export default defineApp({ user: { accounts: {} }, icons }, async ({ fetch, signal }) => {
  const get = async (url: string) => {
    const response = await fetch(url, { signal });
    return decodeJson(response, json());
  };

  const storyList = (path: string, label: string) =>
    query(
      {
        description: `Hacker News ${label}. Returns story objects (id, title, url, by, score, time, descendants, kids), ranked as on the site. limit defaults to 30, max 100. Deleted or dead items can appear as objects with deleted: true or dead: true and no title; unknown ids return null.`,
        input: object({ limit: number().optional() }),
      },
      async (_ctx, { limit }) => {
        const ids = await get(`${firebase}/${path}.json`);
        const count = Math.min(Math.max(Math.trunc(limit ?? 30), 1), 100);
        const picked = (Array.isArray(ids) ? ids : []).slice(0, count);
        return Promise.all(picked.map((id) => get(`${firebase}/item/${String(id)}.json`)));
      },
    );

  const searchInput = object({
    query: string().optional(),
    tags: string().optional(),
    numericFilters: string().optional(),
    page: number().optional(),
    hitsPerPage: number().optional(),
  });

  const searchTool = (endpoint: string, description: string) =>
    query({ description, input: searchInput }, async (_ctx, input) => {
      const params = new URLSearchParams();
      if (input.query !== undefined) params.set("query", input.query);
      if (input.tags !== undefined) params.set("tags", input.tags);
      if (input.numericFilters !== undefined) params.set("numericFilters", input.numericFilters);
      if (input.page !== undefined) params.set("page", String(input.page));
      if (input.hitsPerPage !== undefined) params.set("hitsPerPage", String(input.hitsPerPage));
      return get(`${algolia}/${endpoint}?${params.toString()}`);
    });

  const searchHelp =
    "tags filters by type: story, comment, poll, pollopt, show_hn, ask_hn, front_page, author_<username>, story_<id>; comma means AND, parentheses with commas mean OR (e.g. 'story,(author_pg,author_sama)'). numericFilters take created_at_i, points or num_comments with <, <=, =, >, >= (comma separated, e.g. 'points>100,created_at_i>1700000000'). page is 0-based; hitsPerPage defaults to 20.";

  return {
    tools: router({
      stories: router(
        {
          top: storyList("topstories", "top stories (front page)"),
          new: storyList("newstories", "newest stories"),
          best: storyList("beststories", "best stories"),
          ask: storyList("askstories", "Ask HN stories"),
          show: storyList("showstories", "Show HN stories"),
          jobs: storyList("jobstories", "job postings"),
        },
        { title: "Stories", description: "Ranked story lists from the official Hacker News API." },
      ),
      getItem: query(
        {
          description:
            "Fetch one item (story, comment, job, poll or poll option) by id from the official API. Returns by, text, time, type, url, score, title, parent and kids (child comment ids). Deleted items return an object with deleted: true and no text or by; unknown ids return null.",
          input: object({ id: number() }),
        },
        async (_ctx, { id }) => get(`${firebase}/item/${String(Math.trunc(id))}.json`),
      ),
      getUser: query(
        {
          description:
            "Fetch a user profile by case-sensitive username from the official API: id, created, karma, about and submitted item ids. Unknown users return null.",
          input: object({ username: string({ minLength: 1 }) }),
        },
        async (_ctx, { username }) => get(`${firebase}/user/${encodeURIComponent(username)}.json`),
      ),
      maxItem: query(
        { description: "The current largest item id.", input: object({}) },
        async () => get(`${firebase}/maxitem.json`),
      ),
      updates: query(
        { description: "Recently changed item ids and usernames.", input: object({}) },
        async () => get(`${firebase}/updates.json`),
      ),
      search: router(
        {
          byRelevance: searchTool(
            "search",
            `Full-text search of Hacker News by relevance, then points and comments (Algolia HN Search API). For the current front page use tags=front_page; for today's posts use numericFilters=created_at_i>(now minus 86400) with byDate. ${searchHelp}`,
          ),
          byDate: searchTool(
            "search_by_date",
            `Full-text search of Hacker News, newest first (Algolia HN Search API). ${searchHelp}`,
          ),
          getItem: query(
            {
              description:
                "Fetch a story or comment with its entire nested comment tree in one call (Algolia). Prefer this over walking kids one by one.",
              input: object({ id: number() }),
            },
            async (_ctx, { id }) => get(`${algolia}/items/${String(Math.trunc(id))}`),
          ),
          getUser: query(
            {
              description: "Fetch a user's username, karma and about text (Algolia).",
              input: object({ username: string({ minLength: 1 }) }),
            },
            async (_ctx, { username }) => get(`${algolia}/users/${encodeURIComponent(username)}`),
          ),
        },
        { title: "Search", description: "Full-text search and comment trees through the Algolia HN Search API." },
      ),
    }, {
      title: "Hacker News",
      description: "Read Hacker News: ranked stories, items, comments, users and full-text search.",
      icons,
    }),
  };
});
