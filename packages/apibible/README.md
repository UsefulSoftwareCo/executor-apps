# API.Bible

Read-only access to Scripture through API.Bible (American Bible Society): list Bibles and audio Bibles, browse books, chapters and sections, fetch verses and passages, and search a Bible's text.

Interface: OpenAPI, the official document at https://api.scripture.api.bible/v1/swagger.json (19 operations, all GET; the API itself is served from https://rest.api.bible/v1).

Auth: API key, sent in the `api-key` header. Sign up at https://api.bible and create a key from the dashboard at https://api.bible/team (sign-in: https://api.bible/sign-in). The free Starter plan covers up to 3 licensed Bibles for non-commercial use; larger access needs a paid plan. API.Bible offers no OAuth.

Known gaps: the API is for non-commercial use under API.Bible's terms, and each key only sees the Bibles licensed to it.
