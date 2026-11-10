# WebScraping.AI

Scrape web pages through WebScraping.AI with Chromium JavaScript rendering and rotating proxies: page HTML, visible text, selected elements, Google search results, structured data for supported sites, LLM question answering and field extraction, and account credit quota.

Interface: OpenAPI. The official document at https://webscraping.ai/openapi.yml describes the single API at `https://api.webscraping.ai`, and tools are generated from it live.

Auth: API key. Copy it from the dashboard at https://webscraping.ai/dashboard after signing up; it is sent as the `api_key` query parameter. There is no OAuth.

Known gaps: none known. All operations are GET requests, so none need approval; the API spends account credits on each call.

Icon: the official app icon (512px PNG) served by webscraping.ai (`android-chrome-512x512.png`); the vendor publishes no SVG and Simple Icons has no entry.
