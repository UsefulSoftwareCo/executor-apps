# PDF.co

PDF automation through PDF.co: conversion (PDF to/from Excel, CSV, JSON, HTML, images, Word and more), merge, split, edit, form filling, OCR, barcode generation and reading, document parsing, AI invoice parsing, email helpers, file upload and job status.

## Interface

OpenAPI, loaded live from PDF.co's official document at https://developer.pdf.co/openapi.json (server `https://api.pdf.co`). Mutating operations require approval.

## Auth

API key. Find it in the PDF.co dashboard (https://app.pdf.co/). It is sent in the `x-api-key` header. PDF.co does not offer OAuth. Health check reads the credit balance and decodes `remainingCredits`. Whether PDF.co publishes an official remote MCP server was not confirmed (its llms.txt does not mention one), so the OpenAPI document is used.

## Gaps

PDF.co is credit-based: every call consumes credits. Many operations take file URLs; use the file upload tools first for local content. Webhook/callback features are not exposed as tools.
