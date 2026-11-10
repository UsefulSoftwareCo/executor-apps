# ScrapingBee

Web scraping through ScrapingBee's headless browsers and rotating proxies: page HTML, text and screenshots, structured extraction, file download, Google, Amazon, Walmart and YouTube data, ChatGPT and Gemini queries, and credit usage.

**Interface:** ScrapingBee's official remote MCP server, `https://mcp.scrapingbee.com/mcp` (docs: https://www.scrapingbee.com/documentation/remote-mcp/). It exposes 18 tools (verified live with `tools/list`, which works without a key): `get_page_text`, `get_page_html`, `extract_page_data`, `get_screenshot`, `get_file`, `fast_search`, `get_google_search_results`, `ask_chatgpt`, `ask_gemini`, `get_amazon_search_results`, `get_amazon_product_details`, `get_amazon_pricing`, `get_walmart_search_results`, `get_walmart_product_details`, `get_youtube_search_results`, `get_youtube_video_metadata`, `get_youtube_video_subtitles` and `get_scrapingbee_usage`. ScrapingBee publishes no OpenAPI document, and the MCP server covers more than its documented REST API. Tools are discovered at runtime; any tool not marked read-only requires approval.

**Auth:** API key (`apiKey`). Copy it from https://app.scrapingbee.com/account/manage/api_key (free trial credits on signup). The vendor's docs say the MCP server takes the key as the `api_key` query parameter of the URL, so the key travels in the URL query string and nowhere else (the vendor documents no header or OAuth flow). The MCP server lists tools without a key, so the health check instead calls the read-only `https://app.scrapingbee.com/api/v1/usage` endpoint, which answers 401 for an invalid key. ScrapingBee has no OAuth.

**Known gaps:** Scraping calls spend credits (1 to 75 per page depending on JavaScript rendering and proxy type; AI features add 5). No live call was made (no credentials).

Icon: ScrapingBee's official 512px site icon (`https://www.scrapingbee.com/images/favico.png`); no SVG mark is published separately (the logo SVG is a wordmark).
