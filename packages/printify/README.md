# Printify

Manage Printify print-on-demand shops: shops, catalog blueprints and print providers, products (create, publish, personalization), orders (create, send to production, cancel, shipping, support requests), image uploads and webhooks.

**Interface:** OpenAPI, Printify's official document at https://developers.printify.com/openapi.json (51 tools, all operations on `api.printify.com`; the spec's second server, `enterprise.printful.com`, is not used). Mutations require approval.

**Auth:** personal access token (`apiKey`). Create one in Printify under My Profile > Connections > Generate token, choosing the scopes you need. Tokens expire after one year. OAuth 2.0 requires app registration through a Printify application form with approval, so it is not offered here.

**Icon:** Printify's official app icon from printify.com (300px PNG); the vendor publishes no SVG mark.

**Known gaps:** none known; the health check lists shops, so a token without the shops scope will report unhealthy.
