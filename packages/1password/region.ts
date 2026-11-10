// Regional hosts of the Events API (https://developer.1password.com/docs/events-api/reference),
// keyed by the domain of the account's sign-in address.
export const regions: ReadonlyArray<readonly [domain: string, host: string]> = [
  ["ent.1password.com", "events.ent.1password.com"],
  ["1password.com", "events.1password.com"],
  ["1password.ca", "events.1password.ca"],
  ["1password.eu", "events.1password.eu"],
];

// Accepts a region (`1password.com`), a sign-in address (`acme.1password.eu`, with or without
// https:// and a port) or an Events API host (`events.1password.ca`).
export function host(region: string): string {
  const name = region
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  // The longest matching domain wins: an enterprise address such as `acme.ent.1password.com`
  // also ends in `.1password.com`.
  const found = [...regions]
    .sort(([a], [b]) => b.length - a.length)
    .find(([domain]) => name === domain || name.endsWith(`.${domain}`));
  if (found === undefined)
    throw new Error(
      `"${region}" is not a 1Password region. Connect the account again with the domain of your sign-in address: 1password.com, 1password.ca, 1password.eu or ent.1password.com.`,
    );
  return found[1];
}
