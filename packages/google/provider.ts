import { decodeJson, defineProvider, oauth2, object, string } from "apps";

const Profile = object({ emailAddress: string() });

// Every scope here is on Executor for Google's allowlist, so Executor Cloud can offer its hosted
// client. Google Chat is left out: its chat.* scopes are not on that list.
export const google = defineProvider({
  name: "Google",
  hosts: [
    "gmail.googleapis.com",
    "www.googleapis.com",
    "sheets.googleapis.com",
    "docs.googleapis.com",
    "slides.googleapis.com",
    "forms.googleapis.com",
    "tasks.googleapis.com",
    "people.googleapis.com",
    "meet.googleapis.com",
    "photoslibrary.googleapis.com",
    "photospicker.googleapis.com",
  ],
  auth: {
    // Google offers no client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://mail.google.com/",
        "https://www.googleapis.com/auth/gmail.settings.basic",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/forms.body",
        "https://www.googleapis.com/auth/forms.responses.readonly",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/contacts.other.readonly",
        "https://www.googleapis.com/auth/directory.readonly",
        "https://www.googleapis.com/auth/meetings.space.created",
        "https://www.googleapis.com/auth/meetings.space.readonly",
        "https://www.googleapis.com/auth/meetings.space.settings",
        "https://www.googleapis.com/auth/photoslibrary.appendonly",
        "https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata",
        "https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata",
        "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Profile);
    return { accountInfo: { externalId: me.emailAddress, email: me.emailAddress } };
  },
});

/** The app's requirements, shared by index.ts and the curated tools. */
export const requirements = { user: { accounts: { google: google.many() } } };
