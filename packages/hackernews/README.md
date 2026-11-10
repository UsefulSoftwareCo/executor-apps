# Hacker News

Read-only access to Hacker News: top, new, best, Ask HN, Show HN and job story lists, any item or comment, user profiles, and full-text search with whole comment trees.

Interface: hand-written tools over two public APIs. Hacker News publishes no OpenAPI document, so neither is generated. Stories, items, users, `maxItem` and `updates` use the official Firebase API (https://github.com/HackerNews/API, `https://hacker-news.firebaseio.com/v0`). `search.*` uses the Algolia HN Search API that powers hn.algolia.com (https://hn.algolia.com/api, `https://hn.algolia.com/api/v1`), which is run for Hacker News but is a separate service. 14 tools in total.

Auth: none. Both APIs are public, so the app declares no account and nothing is connected.

Known gaps: Hacker News has no write API (no posting, voting or commenting), and neither API offers authenticated features. Story-list tools fetch each item in parallel (up to 100 per call).
