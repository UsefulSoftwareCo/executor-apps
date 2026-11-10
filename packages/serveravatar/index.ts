import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.serveravatar.com";

const serveravatar = defineProvider({
  name: "ServerAvatar",
  hosts: ["api.serveravatar.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/organizations`, { signal, headers: headers(account.fields.token) });
    await decodeJson(response, object({ organizations: array(object({ id: number(), name: string() })) }));
  },
});

// The vendor docs conflict: the organization page shows a raw token, while the basic-authentication page
// and API Console show "Bearer <token>". We send the Bearer form (the majority of examples).
function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" };
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

// Path placeholders ({server}) are filled from the input. Remaining fields go in the query
// string for GET and DELETE, and in the JSON body otherwise.
function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, template: string, input: Params) => {
    const rest: Params = { ...input };
    const path = template.replace(/\{(\w+)\}/g, (_match, key: string) => {
      const value = rest[key];
      delete rest[key];
      return encodeURIComponent(String(value));
    });
    const url = new URL(base + path);
    let body: string | undefined;
    if (method === "GET" || method === "DELETE") {
      for (const [key, value] of Object.entries(rest)) if (value !== undefined) url.searchParams.set(key, String(value));
    } else if (Object.keys(rest).length > 0) body = JSON.stringify(rest);
    const response = await fetcher(url, { method, signal, headers: headers(token), body });
    return decodeJson(response, json());
  };

  const org = { organization: number() };
  const srv = { ...org, server: number() };
  const app = { ...srv, application: number() };
  const page = { pagination: number().optional() };

  const read = (description: string, path: string, fields: Record<string, unknown>) =>
    query({ description, input: object(fields as never) }, async (_ctx, input) => call("GET", path, input as Params));
  const write = (description: string, method: Method, path: string, fields: Record<string, unknown>) =>
    mutation({ description, input: object(fields as never), approval: always() }, async (_ctx, input) =>
      call(method, path, input as Params),
    );

  const O = "/organizations/{organization}";
  const S = `${O}/servers/{server}`;
  const A = `${S}/applications/{application}`;

  return router({
    organizations: router(
      {
        list: read("List the organizations the API key belongs to, with their members.", "/organizations", {}),
        get: read("Get one organization.", O, org),
      },
      { title: "Organizations" },
    ),
    servers: router(
      {
        list: read("List the servers of an organization. Pass pagination=1 to page the results.", `${O}/servers`, { ...org, ...page }),
        get: read("Get the details of a server.", S, srv),
        status: read("Get the installation status of a server.", `${S}/status`, srv),
        summary: read("Get a short summary of a server.", `${S}/summary`, srv),
        usage: read("Get the disk usage of a server.", `${S}/usage`, srv),
        services: read("List the services running on a server.", `${S}/services`, srv),
        logs: read("List the log files of a server.", `${S}/logs`, srv),
        alerts: read("List the alerts of a server.", `${S}/alert`, srv),
        restart: write("Restart a server.", "GET", `${S}/restart`, srv),
        updateGeneral: write("Update a server's name, hostname, PHP CLI version and timezone.", "POST", `${S}/settings/general`, {
          ...srv,
          name: string(),
          hostname: string(),
          php_cli_version: number().optional(),
          ols_automatically_restart: boolean(),
          timezone: string(),
        }),
        setRestartSchedule: write("Set when a server restarts automatically.", "PATCH", `${S}/restart-server`, {
          ...srv,
          restart_schedule: string().optional(),
          restart_hour: number().optional(),
        }),
        delete: write("Delete a server from ServerAvatar. This cannot be undone.", "DELETE", S, srv),
      },
      { title: "Servers" },
    ),
    applications: router(
      {
        list: read("List the applications on a server.", `${S}/applications`, srv),
        get: read("Get the details of an application.", A, app),
        logSizes: read("Get the sizes of an application's log files.", `${A}/log-sizes`, app),
        sftpCredentials: read("Get an application's SFTP credentials.", `${A}/sftp`, app),
        wordpressAdmins: read("List the WordPress administrators of an application.", `${A}/wordpress/admins`, app),
        toggle: write("Enable or disable an application.", "GET", `${A}/toggle`, app),
        updatePhpSettings: write("Update an application's PHP version and php.ini limits.", "PATCH", `${A}/php-settings`, {
          ...app,
          php_version: string(),
          open_basedir: string().optional(),
          disabled_functions: string(),
          max_execution_time: number(),
          max_input_time: number(),
          max_input_vars: number(),
          memory_limit: string(),
          post_max_size: string(),
          upload_max_filesize: string(),
        }),
        setGitAutoPull: write("Enable or disable automatic git pull for an application. status is true or false.", "PATCH", `${A}/git/webhook/{status}`, {
          ...app,
          status: boolean(),
        }),
        delete: write("Delete an application. This cannot be undone.", "DELETE", A, app),
      },
      { title: "Applications" },
    ),
    domains: router(
      {
        list: read("List the domains of an application.", `${A}/application-domains`, app),
        add: write("Add a domain or subdomain to an application.", "POST", `${A}/application-domains`, { ...app, domain: string() }),
        remove: write("Remove a domain from an application.", "DELETE", `${A}/application-domains/{application_domain}`, {
          ...app,
          application_domain: number(),
        }),
      },
      { title: "Application domains" },
    ),
    ssl: router(
      {
        get: read("Get the SSL certificate installed on an application.", `${A}/ssl`, app),
        install: write("Install an SSL certificate. ssl_type is automatic or custom; custom needs ssl_certificate and private_key.", "POST", `${A}/ssl`, {
          ...app,
          ssl_type: string(),
          ssl_certificate: string().optional(),
          private_key: string().optional(),
          chain_file: string().optional(),
          force_https: boolean(),
        }),
        updateCustom: write("Replace a custom SSL certificate.", "PATCH", `${A}/ssl`, {
          ...app,
          ssl_certificate: string(),
          private_key: string(),
          chain_file: string().optional(),
        }),
        forceHttps: write("Enable the http to https redirect for an application.", "GET", `${A}/ssl/force-https`, app),
        remove: write("Remove an application's SSL certificate.", "DELETE", `${A}/ssl`, app),
      },
      { title: "SSL" },
    ),
    databases: router(
      {
        list: read("List the databases of a server. Optional search filters by name.", `${S}/databases`, { ...srv, ...page, search: string().optional() }),
        listUsers: read("List the users of a database.", `${S}/databases/{database}/database-users`, { ...srv, database: number(), ...page }),
        create: write("Create a database with its first user. connection_preference is localhost, everywhere or specific_ip_addresses.", "POST", `${S}/databases`, {
          ...srv,
          name: string(),
          username: string(),
          password: string(),
          connection_preference: string().optional(),
          hostname: array(string()).optional(),
        }),
        delete: write("Delete a database. This cannot be undone.", "DELETE", `${S}/databases/{database}`, { ...srv, database: number() }),
      },
      { title: "Databases" },
    ),
    cronjobs: router(
      {
        list: read("List the cron jobs of a server.", `${S}/cronjobs`, { ...srv, ...page }),
        create: write(
          "Create a cron job. schedule is a preset (everyMinute, every5Minutes, every10Minutes, every15Minutes, every30Minutes, everyHour, every3Hours, every6Hours, every12Hours, everyDay, everyWeek, everyMonth) or custom, which uses the minute, hour, month, day_of_week and day_of_month fields.",
          "POST",
          `${S}/cronjobs`,
          {
            ...srv,
            name: string(),
            command: string(),
            schedule: string(),
            minute: string().optional(),
            hour: string().optional(),
            month: string().optional(),
            day_of_week: string().optional(),
            day_of_month: string().optional(),
            system_user: string(),
          },
        ),
        delete: write("Delete a cron job. It stops running immediately.", "DELETE", `${S}/cronjobs/{cronjob}`, { ...srv, cronjob: number() }),
      },
      { title: "Cron jobs" },
    ),
    firewall: router(
      {
        list: read("List a server's firewall rules.", `${S}/firewall-rules`, srv),
        create: write("Create a firewall rule. traffic is allow or deny; protocol is all, tcp or udp.", "POST", `${S}/firewall-rules`, {
          ...srv,
          start_port: number(),
          end_port: number().optional(),
          traffic: string(),
          protocol: string(),
          ip: string().optional(),
          description: string().optional(),
        }),
        delete: write("Delete a firewall rule.", "DELETE", `${S}/firewall-rules/{firewall}`, { ...srv, firewall: number() }),
      },
      { title: "Firewall" },
    ),
    supervisors: router(
      {
        list: read("List the supervisor processes of an application.", `${A}/supervisors`, app),
        restart: write("Restart a supervisor process.", "GET", `${A}/supervisors/{supervisor}/restart`, { ...app, supervisor: number() }),
      },
      { title: "Supervisor" },
    ),
    backups: router(
      {
        list: read("List the backups of an organization.", `${O}/backups`, org),
        restore: write("Restore a backup to the same server.", "GET", `${O}/backups/{backupId}/restore`, { ...org, backupId: number() }),
      },
      { title: "Backups" },
    ),
  });
}

export default defineApp(
  { user: { accounts: { serveravatar: serveravatar.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.serveravatar ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "ServerAvatar",
        description:
          "Manage ServerAvatar servers, applications, domains, SSL, databases, cron jobs, firewall rules, supervisors and backups.",
        instructions:
          "Most tools need the organization id (from organizations.list) and the server id (from servers.list). Application tools also need the application id (from applications.list).",
        icons,
      },
    ),
  }),
);
