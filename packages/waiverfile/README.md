# WaiverFile

Covers the WaiverFile digital waiver API: signed waivers (by id, reference id, date range, search, PDF), waiver forms, events and event categories, SMS subscribers, and webhook subscriptions.

Interface: WaiverFile's official Swagger 2.0 document at https://api.waiverfile.com/swagger/docs/v1 (Swagger UI at https://api.waiverfile.com/swagger/ui/index), compiled live into 50 tools (23 POST mutations plus CreateEvent and DeleteEvent, which the Swagger declares as GET but which create and delete events; all 25 require approval).

Auth: API key plus Site ID (`apiKey`). In WaiverFile, go to Settings > API > API keys, click Create a Key, then Show; the Site ID is listed below the key. Both are sent as the `apiKey` and `siteID` query parameters, which is how the API reads them (the Swagger document wrongly declares a header scheme). There is no OAuth.

Known gaps: the spec marks `apiKey` and `siteID` as required parameters on every operation, so tools still list them as inputs; the account's values are applied automatically. Icon is the vendor's 192px app icon (no SVG published).
