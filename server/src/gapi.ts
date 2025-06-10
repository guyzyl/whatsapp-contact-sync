import { google, Auth, people_v1 } from "googleapis";

import { SimpleContact } from "./interfaces";
import { Base64 } from "./types";

const pageSize: number = 250;

export function googleLogin(
  token: typeof google.Auth.AccessTokenResponse
): Auth.OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

export async function listContacts(
  auth: Auth.OAuth2Client
): Promise<SimpleContact[]> {
  const people: people_v1.People = google.people({ version: "v1", auth });

  let simpleContacts: SimpleContact[] = [];
  let nextPageToken = "";

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
            numbers: connection
              .phoneNumbers!.filter((phoneNumber) => phoneNumber.canonicalForm)
              .map((phoneNumber) =>
                phoneNumber.canonicalForm!.replace("+", "")
              ),
            hasPhoto: !connection.photos // Check if photos contain only the "default" photo
              ?.map((photo) => photo.default)
              .every((v) => v === true),
            photoUrl: connection.photos?.find((photo) => photo.metadata?.primary)?.url,
          }
      );

    simpleContacts = simpleContacts.concat(contacts);
  } while (nextPageToken);

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
  }
}
