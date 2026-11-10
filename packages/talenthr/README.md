# TalentHR

Covers the TalentHR HR platform: employees (hire, update, terminate, custom fields, education, goals, time tracking), directory and calendar, job positions and applicants, locations, divisions, departments, job titles, benefits, holidays, time off types and blocked periods, documents, assets, surveys, reports and domain settings.

**Interface:** OpenAPI 3, generated from the official TalentHR API documentation at https://apidocs.talenthr.io/ (a Postman collection; TalentHR publishes no OpenAPI file). `document.json` is a conversion of that collection (paths, query parameters, JSON and multipart request bodies, with the documented field notes as descriptions). The collection does not document response shapes, so responses are left open. Base URL: `https://pubapi.talenthr.io/v1`. This is a conversion of the vendor's own documentation, not a vendor-maintained spec.

**Auth:** API key only (TalentHR offers no OAuth). Create the key in TalentHR under Settings -> Domain settings -> API. It is sent as the HTTP Basic username with an empty password.

**Known gaps:** The document was converted mechanically; a few request bodies (two with non-parsable example JSON) accept a free-form object. Required flags on body fields come from the "(Required)" notes in the docs. All mutations require approval.
