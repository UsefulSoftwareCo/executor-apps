# OneTapCheckIn

Attendance and event check-in with OneTapCheckIn: lists, profiles, participants, passports (including punch passports), links, alerts, organization settings and integrations.

**Interface:** OpenAPI, from the vendor's official public API document at https://api.onetapcheckin.com/docs/openapi.yaml (docs: https://apidocs.onetapcheckin.com/). 48 tools, 27 of them mutations (all require approval).

**Auth:** API key only. Create it in the OneTap dashboard under API integrations. It is sent in the `X-API-Key` header to `api.onetapcheckin.com`. The vendor offers no OAuth.

**Known gaps:** 4 operations are skipped because they authenticate with the `X-Unique-ID` link header (a per-link public check-in credential) instead of the API key.

**Icon:** the hand-tap mark cropped from the vendor's official PNG logo (no SVG or Simple Icons entry is published).
