# Reddit Ads

Manage Reddit advertising: businesses and ad accounts, campaigns, ad groups, ads, custom audiences, pixels, product catalogs, conversions and reports (106 tools, 42 of them mutations that require approval).

Interface: Reddit's official OpenAPI 3.1 document for the Ads API v3, https://ads-api.reddit.com/api/v3/openapi.json, loaded live. API base is https://ads-api.reddit.com/api/v3.

Auth: OAuth 2.0 only (Reddit Ads has no API key). Create an app at https://www.reddit.com/prefs/apps (type "web app") and enter its client ID and secret on the connect page; the redirect URI shown by Executor must be registered on the app. The token endpoint uses HTTP Basic client auth and `duration=permanent` is requested for a refresh token. Scopes: `adsread`, `adsedit`, `adsconversions`. `adsdatadeletion` is not requested, so the three data-deletion operations (`create_data_deletion_job`, `get_data_deletion_job_status`, `create_pixel_data_deletion_job`) are removed from the tool set. The Reddit account must have access to an ad account, and Reddit may require Ads API access approval for the app.

Note: the report tool (`POST /ad_accounts/{id}/reports`) only reads data but is a POST, so it asks for approval like a mutation. Requests go out with the framework's `User-Agent: Executor`; the health check sends `Executor (Reddit Ads app)`.

Known gaps: the Reddit Data API (posts, comments, subreddits) is a separate product and is not covered. Alpha/beta ad products are not in the spec. The icon is the Reddit mark (Simple Icons); Reddit Ads has no separate mark.
