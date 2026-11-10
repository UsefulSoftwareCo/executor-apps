# Cin7 Core

Cin7 Core (formerly DEAR Inventory) inventory and order management: products and product families, customers, suppliers, sales (quotes, orders, pick/pack/ship, invoices, credit notes, payments), purchases and advanced purchases, stock adjustments, takes and transfers, finished goods and disassembly, production (BOMs, orders, runs, resources, work centers), accounts, taxes, locations, price tiers, CRM leads, opportunities and tasks, and webhooks.

## Interface

Hand-written tools (290) over the Cin7 Core API V2 at `https://inventory.dearsystems.com/ExternalApi/v2`. Cin7 publishes no OpenAPI document and no official MCP server; its developer portal (https://dearinventory.docs.apiary.io, API Blueprint source at https://jsapi.apiary.io/apis/dearinventory.apib) lists every endpoint, so each operation is declared from that reference. Query parameters keep Cin7's capitalization; write tools take a `body` with the documented JSON. Every write requires approval.

## Auth

- **API application** (Account ID and Application Key). In Cin7 Core open Integrations > API (https://inventory.dearsystems.com/ExternalAPI), create an API application and copy its Account ID and Application Key. They are sent as the `api-auth-accountid` and `api-auth-applicationkey` headers.

Cin7 Core offers no OAuth for third parties, so none is declared. Requests are rate limited per API application (about 60 per minute).

## Known gaps

- Query parameters are typed from the documentation's names; Cin7 does not publish a machine-readable schema, so write bodies are unvalidated JSON.
- Some documented URLs for task categories and workflows list the wrong GET path; the tools use the resource's own path.
- The icon is the Cin7 Core product icon from cin7.com.
