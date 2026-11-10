# ToneDen

Automated social marketing for music and events: Facebook and Google ad campaigns with insights, smart links and link insights, social unlock and contest attachments with entry/unlock stats, playbook campaigns, custom-audience user lists and offline conversions.

**Interface:** OpenAPI. ToneDen publishes its reference at https://developers.toneden.io as one OpenAPI 3.0 fragment per endpoint (listed in https://developers.toneden.io/llms.txt); `document.json` is those official fragments merged into one document (base URL `https://www.toneden.io/api/v1`).

**Auth**
- OAuth 2.0 (authorization code): create an app under https://www.toneden.io/settings/developer, add this Executor's OAuth redirect URI to the app, and paste the Client ID and Client Secret into the connect page. ToneDen reviews each app before the API works, and the token request is JSON. No scopes are used.
- Access token: a user access token sent as a Bearer header (ToneDen's Getting Started docs say to contact support@toneden.io to get one).

**Known gaps**
- ToneDen's reference describes `DELETE /attachments/{attachmentID}` as "Delete an ad campaign."; that is a vendor typo, the document here describes it as deleting an attachment.
- The user-list endpoints need access enabled by ToneDen support.
- Responses in the spec are loosely typed (a generic success response for most calls).
- The ToneDen docs mention no OAuth discovery metadata, so endpoints are declared explicitly.
