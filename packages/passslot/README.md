# PassSlot

Create and manage Apple Wallet passes with PassSlot: list, look up, update, push, email and delete passes; issue passes from templates (by id or name); manage templates, their actions, branding, distribution restrictions and payment settings; and list pass type IDs and manage scanners.

**Interface:** hand-written tools over the documented REST API v1 (`https://api.passslot.com/v1`, reference at https://www.passslot.com/developer/api/resources). PassSlot publishes no OpenAPI document and no MCP server. Tools are grouped as `passes`, `templates`, `generate`, `passTypes` and `scanners`; every mutation requires approval.

**Auth:** app key. Create one in your PassSlot account under Apps (https://www.passslot.com/account/apps); keys can be limited to specific templates and pass type IDs. It is sent as HTTP basic auth with the key as username and an empty password. PassSlot has no OAuth. The health check lists templates, so a key limited to pass type IDs may be refused.

**Icon:** the PassSlot wordmark from passslot.com (`/public/passslot/website/img/passslot-big.png`, white) placed on the brand yellow of the site's favicon, because the white wordmark alone is invisible on light backgrounds. PassSlot publishes no SVG and Simple Icons has no entry.

**Known gaps:** binary operations are not exposed: downloading the .pkpass file, and uploading or fetching pass and template images and the branding footer image. Creating passes with inline images (variant 2) is not exposed. Create/update tools take the vendor's JSON objects as free-form `json` input, so see the vendor docs for their shape. Payment endpoints need the Professional plan.
