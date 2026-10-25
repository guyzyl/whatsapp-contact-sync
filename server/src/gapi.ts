import { google, Auth, people_v1 } from "googleapis";

import { SimpleContact } from "./interfaces";
import { getTokenStore } from "./gtoken";
import { Base64 } from "./types";

const pageSize: number = 250;

export function generateGoogleAuthUrl(
  redirectUri: string,
  state: string
): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/contacts",
    state,
    prompt: "consent",
  });
}

export async function getOAuth2ClientFromCode(
  code: string,
  redirectUri: string
): Promise<Auth.OAuth2Client> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  getTokenStore().save(tokens);
  persistTokens(oauth2Client);
  return oauth2Client;
}

/**
 * Stores every credential Google hands back.
 *
 * google-auth-library emits `tokens` whenever it refreshes the short-lived
 * access token, so the saved file stays usable for the next restart instead of
 * expiring an hour later.
 */
function persistTokens(oauth2Client: Auth.OAuth2Client): void {
  oauth2Client.on("tokens", (tokens) => {
    getTokenStore().save({ ...oauth2Client.credentials, ...tokens });
  });
}

/**
 * Rebuilds the Google client from the saved refresh token.
 *
 * This is what removes the repeated Google sign-in (and its consent /
 * verification screens) after a backend restart. Returns null when the user
 * never authorized this installation, or when the saved token was revoked.
 */
export function restoreOAuth2Client(
  redirectUri: string
): Auth.OAuth2Client | null {
  const tokens = getTokenStore().load();
  if (!tokens?.refresh_token) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  oauth2Client.setCredentials(tokens);
  persistTokens(oauth2Client);
  return oauth2Client;
}

/** Forget a token Google no longer accepts, so the UI asks to sign in again. */
export function forgetSavedToken(): void {
  getTokenStore().clear();
}

/**
 * True when Google rejected the credentials themselves (revoked access, expired
 * testing-mode refresh token, changed password), as opposed to a network or
 * rate-limit problem.
 */
export function isAuthorizationError(error: unknown): boolean {
  const anyError = error as any;
  const status = anyError?.code ?? anyError?.response?.status;
  const message = String(
    anyError?.response?.data?.error?.error ??
      anyError?.response?.data?.error_description ??
      anyError?.errors?.[0]?.message ??
      (error instanceof Error ? error.message : error)
  );

  return (
    status === 401 ||
    /invalid_grant|invalid_token|unauthorized|expired or revoked/i.test(message)
  );
}

export async function listContacts(
  auth: Auth.OAuth2Client
): Promise<SimpleContact[]> {
  const people: people_v1.People = google.people({ version: "v1", auth });

  let simpleContacts: SimpleContact[] = [];
  let nextPageToken = "";

  try {
    do {
      const res = await people.people.connections.list({
        resourceName: "people/me",
        pageSize: pageSize,
        personFields: "names,emailAddresses,phoneNumbers,photos",
        pageToken: nextPageToken,
      });

      nextPageToken = res.data.nextPageToken!;
      const connections = res.data.connections;

      const contacts = connections!
        .filter((connection) => connection.phoneNumbers)
        .map(
          (connection) =>
            <SimpleContact>{
              id: connection.resourceName,
              name: connection.names?.find((name) => name.displayName)?.displayName,
              // Keep the E.164 `canonicalForm` when Google could parse the number,
              // otherwise fall back to the raw `value` so numbers saved in a local
              // format (no +CC) are normalized later against the user's region
              // instead of being silently dropped.
              numbers: connection
                .phoneNumbers!.map(
                  (phoneNumber) => phoneNumber.canonicalForm ?? phoneNumber.value
                )
                .filter((number): number is string => Boolean(number)),
              hasPhoto: !connection.photos // Check if photos contain only the "default" photo
                ?.map((photo) => photo.default)
                .every((v) => v === true),
              photoUrl: connection.photos?.find((photo) => photo.metadata?.primary)?.url,
            }
        );

      simpleContacts = simpleContacts.concat(contacts);
    } while (nextPageToken);
  } catch (e) {
    // A dead refresh token will never recover on retry; drop it so the next
    // page load asks for a sign-in instead of failing every sync.
    if (isAuthorizationError(e)) forgetSavedToken();
    throw e;
  }

  return simpleContacts;
}

export async function updateContactPhoto(
  auth: Auth.OAuth2Client,
  resourceName: string,
  photo: Base64
): Promise<void> {
  const people: people_v1.People = google.people({ version: "v1", auth });

  try {
    await people.people.updateContactPhoto({
      resourceName: resourceName,
      requestBody: { photoBytes: photo },
    });
  } catch (e) {
    console.error(e);
    // Mid-sync the token can die as well; forget it so the next page load asks
    // for a fresh sign-in instead of failing every remaining contact.
    if (isAuthorizationError(e)) forgetSavedToken();
  }
}
