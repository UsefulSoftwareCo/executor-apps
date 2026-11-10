import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./document.ts";

export const scopes = ["create_jobs","create_notifications","manage_assets","manage_attachments","manage_badges","manage_customer_contacts","manage_customers","manage_feedback","manage_forms","manage_inventory","manage_job_categories","manage_job_checklists","manage_job_contacts","manage_job_materials","manage_job_payments","manage_job_queues","manage_jobs","manage_knowledge","manage_locations","manage_schedule","manage_service_templates","manage_staff","manage_suppliers","manage_tasks","manage_tax_rates","manage_templates","publish_diary_items","publish_inbox","publish_job_notes","publish_messages","read_assets","read_attachments","read_badges","read_customer_contacts","read_customers","read_email","read_feedback","read_forms","read_inbox","read_inventory","read_job_admin_activity","read_job_categories","read_job_checklists","read_job_contacts","read_job_materials","read_job_notes","read_job_payments","read_job_queues","read_jobs","read_knowledge","read_locations","read_messages","read_schedule","read_security_roles","read_service_templates","read_sms","read_staff","read_staff_time_events","read_suppliers","read_tasks","read_tax_rates","read_templates","vendor"];

export const options = {
  source: { document },
  allowedOrigin: "https://api.servicem8.com",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "X-Api-Key", in: "header" },
    oauth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://go.servicem8.com/oauth/authorize",
          tokenUrl: "https://go.servicem8.com/oauth/access_token",
          scopes: {},
        },
      },
    },
  },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: ["oauth2"],
} satisfies OpenapiToolNamesOptions;
