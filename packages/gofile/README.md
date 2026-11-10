# Gofile

Upload, organize and share files on Gofile: file upload, folder creation, reading and searching folders, renaming and changing attributes (tags, public, password, expiry), copy, move, import, delete, direct links, and account details.

**Interface:** hand-written tools over Gofile's documented REST API (`https://api.gofile.io`, uploads at `https://upload.gofile.io`; reference at https://gofile.io/api). Gofile publishes no OpenAPI document and no MCP server, so 15 endpoints are wrapped directly. Mutations (upload, create folder, update, delete, copy, move, import, direct-link changes, token reset) require approval.

**Auth:** API token, sent as `Authorization: Bearer <token>`. Copy it from your profile page at https://gofile.io/. Gofile has no OAuth.

**Icon:** Gofile's official 300px logo PNG (`https://gofile.io/assets/img/logo-small-og.png`); the mark is not in Simple Icons and Gofile publishes no SVG.

**Known gaps:** several endpoints (folder read, search, copy, move, import, direct links) require a Premium account and return `error-notPremium` otherwise. Uploads take the file as text or base64 in the tool input, so they suit small files. Regional upload hosts are not selectable (the automatic `upload.gofile.io` is used). Guest account creation (`POST /accounts`) and the recycle bin endpoints (undocumented beta) are not exposed. The API is rate limited and repeated violations can lead to IP bans.
