# TikHub

Public social media data through the TikHub API: TikTok, Douyin, Instagram, YouTube, Twitter/X, Reddit, Threads, Xiaohongshu, Lemon8, Bilibili, Kuaishou, Weibo, WeChat, Zhihu and account/usage endpoints for TikHub itself. 1050 tools are generated, 225 of them POST operations that require approval.

**Interface:** TikHub's official OpenAPI document, https://api.tikhub.io/openapi.json (live, FastAPI). The document declares no server, so the package sets `baseUrl` to `https://api.tikhub.io`.

**Auth:** API key (`secrets`). Create it in the TikHub user center under "API Token" at https://user.tikhub.io and paste it into Executor; it is sent as `Authorization: Bearer <token>`. TikHub has no OAuth. The health check calls `/api/v1/tikhub/user/get_user_info`.

**Gaps:** Requests are billed against the TikHub account balance; the `tikhub/user` endpoints report usage and pricing. The icon is cropped from the logo on tikhub.io (the vendor publishes no SVG) and sits on a white tile in both variants.
