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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pilvio.com/v1";

const pilvio = defineProvider({
  name: "Pilvio",
  hosts: ["api.pilvio.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user-resource/user`, { signal, headers: { apikey: account.fields.token } });
    const user = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: String(user.id), displayName: user.name } };
  },
});

type Fetch = typeof fetch;
type Scalar = string | number | boolean | undefined;
type Request = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  // Data-centre slug from Locations; inserted after /v1 for location-specific endpoints.
  location?: string | undefined;
  query?: Record<string, Scalar>;
  // Sent as application/x-www-form-urlencoded (the older endpoints).
  form?: Record<string, Scalar>;
  // Sent as application/json (the network endpoints).
  body?: unknown;
};

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (request: Request) => {
    const prefix = request.location === undefined || request.location === "" ? "" : `/${encodeURIComponent(request.location)}`;
    const url = new URL(`${base}${prefix}${request.path}`);
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { apikey: token };
    let body: string | undefined;
    if (request.form !== undefined) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(request.form)) {
        if (value !== undefined) params.set(key, String(value));
      }
      body = params.toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (request.body !== undefined) {
      body = JSON.stringify(request.body);
      headers["Content-Type"] = "application/json";
    }
    const init: RequestInit = { method: request.method, headers, signal };
    if (body !== undefined) init.body = body;
    const response = await fetcher(url.toString(), init);
    // Deletes and unassignments may answer with an empty body.
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return { ok: true };
    return decodeJson(response, json());
  };
}

const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const id = () => string({ minLength: 1 });
const seg = encodeURIComponent;
const location = optStr();

function build(call: ReturnType<typeof client>) {
  const user = router(
    {
      get: query({ description: "Get the authenticated user and profile.", input: object({}) }, () =>
        call({ method: "GET", path: "/user-resource/user" }),
      ),
      updateProfile: mutation(
        {
          description: "Update the profile: first name, last name, phone number, personal ID number.",
          input: object({ first_name: optStr(), last_name: optStr(), phone_number: optStr(), personal_id_number: optStr() }),
        },
        (_c, form) => call({ method: "PATCH", path: "/user-resource/user/profile", form }),
      ),
      listSshKeys: query({ description: "List the user's SSH public keys.", input: object({}) }, () =>
        call({ method: "GET", path: "/user-resource/ssh_keys" }),
      ),
      createSshKey: mutation(
        {
          description: "Add an SSH public key (full OpenSSH line). The name must be unique per user and the key is immutable.",
          input: object({ name: id(), public_key: id() }),
        },
        (_c, body) => call({ method: "POST", path: "/user-resource/ssh_keys", body }),
      ),
      renameSshKey: mutation(
        { description: "Rename an SSH key by UUID.", input: object({ uuid: id(), name: id() }) },
        (_c, { uuid, name }) => call({ method: "PATCH", path: `/user-resource/ssh_keys/${seg(uuid)}`, body: { name } }),
      ),
      deleteSshKey: mutation({ description: "Delete an SSH key by UUID.", input: object({ uuid: id() }) }, (_c, { uuid }) =>
        call({ method: "DELETE", path: `/user-resource/ssh_keys/${seg(uuid)}` }),
      ),
      listTokens: query({ description: "List the user's API tokens.", input: object({}) }, () =>
        call({ method: "GET", path: "/user-resource/token/list" }),
      ),
      createToken: mutation(
        {
          description: "Create an API token. restricted limits it to one billing account (billing_account_id).",
          input: object({ description: optStr(), restricted: optBool(), billing_account_id: optNum() }),
        },
        (_c, form) => call({ method: "POST", path: "/user-resource/token", form }),
      ),
      updateToken: mutation(
        {
          description: "Update an API token's description or restriction. Any restricted value sets it to true.",
          input: object({ token_id: number(), description: optStr(), restricted: optBool(), billing_account_id: optNum() }),
        },
        (_c, form) => call({ method: "PATCH", path: "/user-resource/token", form }),
      ),
      deleteToken: mutation({ description: "Delete an API token.", input: object({ token_id: number() }) }, (_c, form) =>
        call({ method: "DELETE", path: "/user-resource/token", form }),
      ),
    },
    { title: "User", description: "Profile, SSH keys and API tokens." },
  );

  const config = router(
    {
      listLocations: query(
        {
          description:
            "List data centres. Pass a slug as location on location-specific tools to target it; the default location is used otherwise.",
          input: object({}),
        },
        () => call({ method: "GET", path: "/config/locations" }),
      ),
      vmParameters: query({ description: "Allowed VM parameters (CPU, RAM, disk limits).", input: object({}) }, () =>
        call({ method: "GET", path: "/api/parameters/vm" }),
      ),
      listVmImages: query({ description: "List all VM OS images.", input: object({}) }, () =>
        call({ method: "GET", path: "/config/vm_images" }),
      ),
      listPlainOsImages: query({ description: "List plain OS images.", input: object({}) }, () =>
        call({ method: "GET", path: "/config/vm_images/plain_os" }),
      ),
      listAppCatalogImages: query({ description: "List app catalog images.", input: object({}) }, () =>
        call({ method: "GET", path: "/config/vm_images/app_catalog" }),
      ),
      listBootImages: query({ description: "List bootable media (rescue and installation ISO) images.", input: object({}) }, () =>
        call({ method: "GET", path: "/config/boot_images" }),
      ),
      listResourcePools: query({ description: "List VM resource pools (server classes).", input: object({ location }) }, (_c, { location }) =>
        call({ method: "GET", path: "/user-resource/host_pool/list", location }),
      ),
    },
    { title: "Configuration", description: "Locations, images, resource pools and VM limits." },
  );

  const vmId = { uuid: id(), location };
  const vm = router(
    {
      list: query({ description: "List virtual machines in a location.", input: object({ location }) }, (_c, { location }) =>
        call({ method: "GET", path: "/user-resource/vm/list", location }),
      ),
      get: query({ description: "Get a virtual machine by UUID.", input: object(vmId) }, (_c, { uuid, location }) =>
        call({ method: "GET", path: "/user-resource/vm", location, query: { uuid } }),
      ),
      create: mutation(
        {
          description:
            "Create a virtual machine. Use os_name and os_version from the image lists (os_name _custom and os_version _ for an empty disk). source_uuid with source_replica copies a backup or snapshot; disk_uuid boots from an existing disk. cloud_init is a JSON object serialized as a string. reserve_public_ip defaults to true.",
          input: object({
            location,
            name: optStr(),
            os_name: optStr(),
            os_version: optStr(),
            disks: optStr(),
            vcpu: optNum(),
            ram: optNum(),
            username: optStr(),
            password: optStr(),
            public_key: optStr(),
            billing_account_id: optNum(),
            designated_pool_uuid: optStr(),
            network_uuid: optStr(),
            description: optStr(),
            backup: optBool(),
            reserve_public_ip: optBool(),
            source_uuid: optStr(),
            source_replica: optStr(),
            disk_uuid: optStr(),
            cloud_init: optStr(),
          }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm", location, form }),
      ),
      modify: mutation(
        {
          description: "Rename a VM or change its vcpu and ram (the VM must be stopped to change vcpu or ram).",
          input: object({ ...vmId, name: optStr(), vcpu: optNum(), ram: optNum() }),
        },
        (_c, { location, ...form }) => call({ method: "PATCH", path: "/user-resource/vm", location, form }),
      ),
      delete: mutation({ description: "Delete a virtual machine.", input: object(vmId) }, (_c, { location, ...form }) =>
        call({ method: "DELETE", path: "/user-resource/vm", location, form }),
      ),
      start: mutation({ description: "Start a virtual machine.", input: object(vmId) }, (_c, { location, ...form }) =>
        call({ method: "POST", path: "/user-resource/vm/start", location, form }),
      ),
      stop: mutation(
        {
          description: "Stop a virtual machine. By default an ACPI shutdown; force pulls the plug and can corrupt data.",
          input: object({ ...vmId, force: optBool() }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/stop", location, form }),
      ),
      changePassword: mutation(
        {
          description: "Set a new password for an existing user on a running VM.",
          input: object({ ...vmId, username: id(), password: id() }),
        },
        (_c, { location, ...form }) => call({ method: "PATCH", path: "/user-resource/vm/user", location, form }),
      ),
      reinstall: mutation(
        {
          description: "Discard the VM's storage and reinstall an OS image. Defaults to the current OS and version.",
          input: object({ ...vmId, os_name: optStr(), os_version: optStr() }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/reinstall", location, form }),
      ),
      clone: mutation({ description: "Clone a virtual machine.", input: object({ ...vmId, name: optStr() }) }, (_c, { location, ...form }) =>
        call({ method: "POST", path: "/user-resource/vm/clone", location, form }),
      ),
      toggleBackup: mutation({ description: "Toggle automatic backups for a VM.", input: object(vmId) }, (_c, { location, ...form }) =>
        call({ method: "POST", path: "/user-resource/vm/backup", location, form }),
      ),
      bootMedia: mutation(
        {
          description:
            "Boot the VM once from a rescue or installation ISO. boot_image_repository is platform (default) or private (a disk with read_only_bootable).",
          input: object({ ...vmId, boot_image_uuid: optStr(), boot_image_repository: optStr() }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/boot_iso_media", location, form }),
      ),
      listReplicas: query({ description: "List a VM's replicas. r_type defaults to snapshot; pass backup to list backups.", input: object({ ...vmId, r_type: optStr() }) }, (_c, { uuid, location, r_type }) =>
        call({ method: "GET", path: "/user-resource/vm/replica", location, query: { uuid, r_type } }),
      ),
      createReplica: mutation({ description: "Create a snapshot replica of a VM's disk.", input: object(vmId) }, (_c, { location, ...form }) =>
        call({ method: "POST", path: "/user-resource/vm/replica", location, form }),
      ),
      deleteReplica: mutation(
        { description: "Delete a replica by UUID.", input: object({ replica_uuid: id(), location }) },
        (_c, { location, ...form }) => call({ method: "DELETE", path: "/user-resource/vm/replica", location, form }),
      ),
      rebuildFromReplica: mutation(
        {
          description: "Discard the VM's storage and restore it from a replica.",
          input: object({ ...vmId, replica_uuid: id() }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/rebuild", location, form }),
      ),
      addDisk: mutation(
        { description: "Create a disk of size_gb and attach it to a VM.", input: object({ ...vmId, size_gb: number() }) },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/storage", location, form }),
      ),
      resizeDisk: mutation(
        {
          description: "Grow a VM disk to size_gb (cannot shrink).",
          input: object({ ...vmId, disk_uuid: id(), size_gb: number() }),
        },
        (_c, { location, ...form }) => call({ method: "PATCH", path: "/user-resource/vm/storage", location, form }),
      ),
      deleteDisk: mutation(
        { description: "Delete a disk attached to a VM.", input: object({ ...vmId, storage_uuid: id() }) },
        (_c, { location, ...form }) => call({ method: "DELETE", path: "/user-resource/vm/storage", location, form }),
      ),
      attachDisk: mutation(
        { description: "Attach an existing block storage disk to a VM.", input: object({ ...vmId, storage_uuid: id() }) },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/storage/attach", location, form }),
      ),
      detachDisk: mutation(
        { description: "Detach a disk from a VM.", input: object({ ...vmId, storage_uuid: id() }) },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/vm/storage/detach", location, form }),
      ),
    },
    { title: "Virtual machines", description: "Create, inspect, power, resize, back up and delete virtual machines." },
  );

  const disks = router(
    {
      list: query(
        { description: "List block storage disks. read_only_bootable filters bootable media disks.", input: object({ read_only_bootable: optBool() }) },
        (_c, q) => call({ method: "GET", path: "/storage/disks", query: q }),
      ),
      get: query({ description: "Get a disk by UUID.", input: object({ disk_uuid: id() }) }, (_c, { disk_uuid }) =>
        call({ method: "GET", path: `/storage/disks/${seg(disk_uuid)}` }),
      ),
      create: mutation(
        {
          description: "Create a standalone block storage disk. source_image_type is EMPTY or an image type with source_image.",
          input: object({ size_gb: number(), display_name: optStr(), billing_account_id: optNum(), source_image_type: optStr(), source_image: optStr() }),
        },
        (_c, form) => call({ method: "POST", path: "/storage/disks", form }),
      ),
      update: mutation(
        {
          description: "Rename a disk, change its billing account or mark it a read-only bootable image.",
          input: object({ disk_uuid: id(), display_name: optStr(), billing_account_id: optNum(), read_only_bootable: optBool() }),
        },
        (_c, { disk_uuid, ...form }) => call({ method: "PATCH", path: `/storage/disks/${seg(disk_uuid)}`, form }),
      ),
      delete: mutation({ description: "Delete a disk.", input: object({ disk_uuid: id() }) }, (_c, { disk_uuid }) =>
        call({ method: "DELETE", path: `/storage/disks/${seg(disk_uuid)}` }),
      ),
    },
    { title: "Block storage", description: "Standalone disks that can be attached to VMs." },
  );

  const objectStorage = router(
    {
      s3Info: query({ description: "Get the S3 API endpoint information.", input: object({}) }, () =>
        call({ method: "GET", path: "/storage/api/s3" }),
      ),
      listBuckets: query(
        { description: "List buckets, optionally for one billing account.", input: object({ billing_account_id: optNum() }) },
        (_c, q) => call({ method: "GET", path: "/storage/bucket/list", query: q }),
      ),
      getBucket: query({ description: "Get a bucket by name.", input: object({ name: id() }) }, (_c, q) =>
        call({ method: "GET", path: "/storage/bucket", query: q }),
      ),
      createBucket: mutation(
        { description: "Create a bucket.", input: object({ name: id(), billing_account_id: optNum() }) },
        (_c, form) => call({ method: "PUT", path: "/storage/bucket", form }),
      ),
      modifyBucket: mutation(
        { description: "Change a bucket's billing account.", input: object({ name: id(), billing_account_id: number() }) },
        (_c, form) => call({ method: "PATCH", path: "/storage/bucket", form }),
      ),
      deleteBucket: mutation({ description: "Delete a bucket.", input: object({ name: id() }) }, (_c, q) =>
        call({ method: "DELETE", path: "/storage/bucket", query: q }),
      ),
      listKeys: query({ description: "List S3 access keys.", input: object({}) }, () =>
        call({ method: "GET", path: "/storage/user/keys" }),
      ),
      generateKey: mutation({ description: "Generate a new S3 access key pair.", input: object({}) }, () =>
        call({ method: "POST", path: "/storage/user/keys" }),
      ),
      deleteKey: mutation({ description: "Delete an S3 access key.", input: object({ access_key: id() }) }, (_c, form) =>
        call({ method: "DELETE", path: "/storage/user/keys", form }),
      ),
    },
    { title: "Object storage", description: "S3 buckets and access keys." },
  );

  const ipAddress = (address: string) => `/network/ip_addresses/${seg(address)}`;
  const network = router(
    {
      listNetworks: query({ description: "List private networks.", input: object({ location }) }, (_c, { location }) =>
        call({ method: "GET", path: "/network/networks", location }),
      ),
      getNetwork: query({ description: "Get a private network.", input: object({ network_uuid: id(), location }) }, (_c, { network_uuid, location }) =>
        call({ method: "GET", path: `/network/network/${seg(network_uuid)}`, location }),
      ),
      createNetwork: mutation({ description: "Create a private network.", input: object({ name: id(), location }) }, (_c, { name, location }) =>
        call({ method: "POST", path: "/network/network", location, query: { name } }),
      ),
      renameNetwork: mutation(
        { description: "Rename a private network.", input: object({ network_uuid: id(), name: id(), location }) },
        (_c, { network_uuid, name, location }) =>
          call({ method: "PATCH", path: `/network/network/${seg(network_uuid)}`, location, body: { name } }),
      ),
      setDefaultNetwork: mutation(
        { description: "Make a network the default for new VMs.", input: object({ network_uuid: id(), location }) },
        (_c, { network_uuid, location }) => call({ method: "PUT", path: `/network/network/${seg(network_uuid)}/default`, location }),
      ),
      deleteNetwork: mutation({ description: "Delete a private network.", input: object({ network_uuid: id(), location }) }, (_c, { network_uuid, location }) =>
        call({ method: "DELETE", path: `/network/network/${seg(network_uuid)}`, location }),
      ),
      listFloatingIps: query(
        {
          description: "List floating IPs, optionally for a billing account or assigned to a VM.",
          input: object({ billing_account_id: optNum(), vm_uuid: optStr(), location }),
        },
        (_c, { location, ...q }) => call({ method: "GET", path: "/network/ip_addresses", location, query: q }),
      ),
      getFloatingIp: query({ description: "Get a floating IP by address.", input: object({ address: id(), location }) }, (_c, { address, location }) =>
        call({ method: "GET", path: ipAddress(address), location }),
      ),
      createFloatingIp: mutation(
        { description: "Reserve a floating IP.", input: object({ name: optStr(), billing_account_id: optNum(), location }) },
        (_c, { location, ...body }) => call({ method: "POST", path: "/network/ip_addresses", location, body }),
      ),
      updateFloatingIp: mutation(
        { description: "Rename a floating IP or change its billing account.", input: object({ address: id(), name: optStr(), billing_account_id: optNum(), location }) },
        (_c, { address, location, ...body }) => call({ method: "PATCH", path: ipAddress(address), location, body }),
      ),
      deleteFloatingIp: mutation({ description: "Release a floating IP.", input: object({ address: id(), location }) }, (_c, { address, location }) =>
        call({ method: "DELETE", path: ipAddress(address), location }),
      ),
      assignFloatingIp: mutation(
        {
          description: "Assign a floating IP. assigned_to_resource_type is virtual_machine, service or load_balancer.",
          input: object({ address: id(), assigned_to: id(), assigned_to_resource_type: id(), location }),
        },
        (_c, { address, location, ...body }) => call({ method: "POST", path: `${ipAddress(address)}/assign`, location, body }),
      ),
      unassignFloatingIp: mutation({ description: "Unassign a floating IP.", input: object({ address: id(), location }) }, (_c, { address, location }) =>
        call({ method: "POST", path: `${ipAddress(address)}/unassign`, location }),
      ),
    },
    { title: "Networking", description: "Private networks and floating IPs." },
  );

  const rule = object({
    protocol: id(),
    direction: id(),
    port_start: optNum(),
    port_end: optNum(),
    endpoint_spec_type: id(),
    endpoint_spec: array(string()).optional(),
  });
  const firewall = router(
    {
      list: query({ description: "List firewalls.", input: object({ location }) }, (_c, { location }) =>
        call({ method: "GET", path: "/network/firewalls", location }),
      ),
      create: mutation(
        {
          description:
            "Create a firewall. direction is inbound or outbound; protocol tcp, udp or icmp; endpoint_spec_type any or ip_prefixes (with endpoint_spec CIDRs). Omit port_start for all ports.",
          input: object({ display_name: id(), billing_account_id: optNum(), rules: array(rule), location }),
        },
        (_c, { location, ...body }) => call({ method: "POST", path: "/network/firewalls", location, body }),
      ),
      update: mutation(
        {
          description: "Replace a firewall's name and rules.",
          input: object({ firewall_uuid: id(), display_name: optStr(), rules: array(rule), location }),
        },
        (_c, { firewall_uuid, location, ...body }) =>
          call({ method: "PUT", path: `/network/firewalls/${seg(firewall_uuid)}`, location, body }),
      ),
      delete: mutation({ description: "Delete a firewall.", input: object({ firewall_uuid: id(), location }) }, (_c, { firewall_uuid, location }) =>
        call({ method: "DELETE", path: `/network/firewalls/${seg(firewall_uuid)}`, location }),
      ),
      assignToVm: mutation(
        { description: "Assign a firewall to a VM.", input: object({ firewall_uuid: id(), vm_uuid: id(), location }) },
        (_c, { firewall_uuid, vm_uuid, location }) =>
          call({ method: "POST", path: `/network/firewalls/${seg(firewall_uuid)}/vms`, location, query: { vm_uuid } }),
      ),
      unassignFromVm: mutation(
        { description: "Remove a firewall from a VM.", input: object({ firewall_uuid: id(), vm_uuid: id(), location }) },
        (_c, { firewall_uuid, vm_uuid, location }) =>
          call({ method: "DELETE", path: `/network/firewalls/${seg(firewall_uuid)}/vms`, location, query: { vm_uuid } }),
      ),
    },
    { title: "Firewalls", description: "Firewalls and their rules, assigned to VMs." },
  );

  const lb = (uuid: string) => `/network/load_balancers/${seg(uuid)}`;
  const loadBalancers = router(
    {
      list: query({ description: "List load balancers.", input: object({ location }) }, (_c, { location }) =>
        call({ method: "GET", path: "/network/load_balancers", location }),
      ),
      get: query({ description: "Get a load balancer.", input: object({ load_balancer_uuid: id(), location }) }, (_c, { load_balancer_uuid, location }) =>
        call({ method: "GET", path: lb(load_balancer_uuid), location }),
      ),
      create: mutation(
        {
          description: "Create a load balancer with forwarding rules and VM targets.",
          input: object({
            display_name: optStr(),
            billing_account_id: optNum(),
            network_uuid: optStr(),
            reserve_public_ip: optBool(),
            rules: array(object({ source_port: number(), target_port: number() })).optional(),
            targets: array(object({ target_uuid: id(), target_type: id() })).optional(),
            location,
          }),
        },
        (_c, { location, ...body }) => call({ method: "POST", path: "/network/load_balancers", location, body }),
      ),
      rename: mutation(
        { description: "Rename a load balancer.", input: object({ load_balancer_uuid: id(), display_name: id(), location }) },
        (_c, { load_balancer_uuid, location, ...body }) => call({ method: "PATCH", path: lb(load_balancer_uuid), location, body }),
      ),
      delete: mutation({ description: "Delete a load balancer.", input: object({ load_balancer_uuid: id(), location }) }, (_c, { load_balancer_uuid, location }) =>
        call({ method: "DELETE", path: lb(load_balancer_uuid), location }),
      ),
      addTarget: mutation(
        {
          description: "Add a target (target_type vm) to a load balancer.",
          input: object({ load_balancer_uuid: id(), target_uuid: id(), target_type: id(), location }),
        },
        (_c, { load_balancer_uuid, location, ...body }) =>
          call({ method: "POST", path: `${lb(load_balancer_uuid)}/targets`, location, body }),
      ),
      removeTarget: mutation(
        { description: "Unlink a target from a load balancer.", input: object({ load_balancer_uuid: id(), target_uuid: id(), location }) },
        (_c, { load_balancer_uuid, target_uuid, location }) =>
          call({ method: "DELETE", path: `${lb(load_balancer_uuid)}/targets/${seg(target_uuid)}`, location }),
      ),
      addRule: mutation(
        {
          description: "Add a port forwarding rule to a load balancer.",
          input: object({ load_balancer_uuid: id(), source_port: number(), target_port: number(), location }),
        },
        (_c, { load_balancer_uuid, location, ...body }) =>
          call({ method: "POST", path: `${lb(load_balancer_uuid)}/forwarding_rules`, location, body }),
      ),
      removeRule: mutation(
        { description: "Drop a forwarding rule from a load balancer.", input: object({ load_balancer_uuid: id(), rule_uuid: id(), location }) },
        (_c, { load_balancer_uuid, rule_uuid, location }) =>
          call({ method: "DELETE", path: `${lb(load_balancer_uuid)}/forwarding_rules/${seg(rule_uuid)}`, location }),
      ),
    },
    { title: "Load balancers", description: "Network load balancers, targets and forwarding rules." },
  );

  const billing = router(
    {
      listBillingAccounts: query({ description: "List billing accounts.", input: object({}) }, () =>
        call({ method: "GET", path: "/payment/billing_account/list" }),
      ),
      getBillingAccount: query({ description: "Get a billing account's details.", input: object({ billing_account_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/billing_account", query: q }),
      ),
      unpaidAmount: query({ description: "Get the unpaid amount of a billing account.", input: object({ billing_account_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/billing_account/unpaid_amount", query: q }),
      ),
      listResources: query(
        { description: "List the resources billed to a billing account.", input: object({ id: number(), location }) },
        (_c, { location, ...q }) => call({ method: "GET", path: "/user-resource/billing_resources", location, query: q }),
      ),
      setResourceBilling: mutation(
        {
          description: "Associate a resource (resource_type defaults to vm) with a billing account.",
          input: object({ billing_account_id: number(), uuid: id(), resource_type: optStr(), location }),
        },
        (_c, { location, ...form }) => call({ method: "POST", path: "/user-resource/resource_billing", location, form }),
      ),
      listCredit: query({ description: "List credit on a billing account.", input: object({ billing_account_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/credit/list", query: q }),
      ),
      listCards: query({ description: "List credit cards on a billing account.", input: object({ billing_account_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/card/list", query: q }),
      ),
      listInvoices: query({ description: "List invoices of a billing account.", input: object({ billing_account_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/invoice/list", query: q }),
      ),
      getInvoice: query({ description: "Get an invoice.", input: object({ invoice_id: number() }) }, (_c, q) =>
        call({ method: "GET", path: "/payment/invoice", query: q }),
      ),
      usage: query(
        { description: "Resources, prices and costs of a billing account for the current month.", input: object({ billing_account_id: number() }) },
        (_c, q) => call({ method: "GET", path: "/charging/usage", query: q }),
      ),
      pricing: query({ description: "Get the pricing policy.", input: object({}) }, () => call({ method: "GET", path: "/pricing/policy" })),
    },
    {
      title: "Billing",
      description: "Billing accounts, credit, invoices, usage and pricing. Payments and card changes are not exposed.",
    },
  );

  return router({ user, config, vm, disks, objectStorage, network, firewall, loadBalancers, billing });
}

export default defineApp(
  { user: { accounts: { pilvio: pilvio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pilvio ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pilvio",
        description: "Estonian cloud: virtual machines, block and S3 object storage, private networks, floating IPs, firewalls, load balancers and billing.",
        instructions:
          "Location-specific tools (VMs, networks, firewalls, load balancers, floating IPs) act on the default location unless you pass location with a slug from config.listLocations. Resources in other locations are not included in list results.",
        icons,
      },
    ),
  }),
);
