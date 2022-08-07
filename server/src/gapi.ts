import { google, Auth, people_v1 } from "googleapis";

import { SimpleContact } from "./interfaces";
import { Base64 } from "./types";

import dotenv from "dotenv";
dotenv.config();

const pageSize: number = 250;

export function googleLogin(
  token: typeof google.Auth.AccessTokenResponse
): Auth.OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(token);
  verifyAuth(oauth2Client);

  return oauth2Client;
}

export function verifyAuth(auth: Auth.OAuth2Client): void {
  // TODO: Implement
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
      personFields: "names,emailAddresses,phoneNumbers",
      pageToken: nextPageToken,
    });

    nextPageToken = res.data.nextPageToken!;
    const connections = res.data.connections;

    for (const connection of connections) {
      let phoneNumbers: string[] = [];
      if (connection.phoneNumbers) {
        for (const phoneNumberObj of connection.phoneNumbers) {
          if (!phoneNumberObj.canonicalForm) continue;
          phoneNumbers.push(phoneNumberObj.canonicalForm.replace("+", ""));
        }
      }

      const simpleContact: SimpleContact = {
        id: connection.resourceName,
        numbers: phoneNumbers,
        name: connection.names[0].displayName,
      };

      simpleContacts.push(simpleContact);
    }
  } while (nextPageToken);

  return simpleContacts;
}

export async function updateContactPhoto(
  auth: Auth.OAuth2Client,
  resourceName: string,
  photo: Base64
): Promise<void> {
  const people: people_v1.People = google.people({ version: "v1", auth });

  await people.people.updateContactPhoto({
    resourceName: resourceName,
    requestBody: { photoBytes: photo },
  });
}
