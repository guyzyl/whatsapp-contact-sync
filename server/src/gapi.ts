const { google, AuthClient, AccessTokenResponse } = require("googleapis");

import { SimpleContact } from "./interfaces";
import { Base64 } from "./types";

const dotenv = require("dotenv");
dotenv.config();

const pageSize = 250;

// TODO: Create / use interface for token
export function googleLogin(
  token: typeof AccessTokenResponse
): typeof AuthClient {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.YOUR_CLIENT_SECRET
  );
  oauth2Client.setCredentials(token);
  verifyAuth(oauth2Client);

  return oauth2Client;
}

export function verifyAuth(auth: typeof AuthClient): void {
  // TODO: Implement
}

export async function listContacts(
  auth: typeof AuthClient
): Promise<SimpleContact[]> {
  const service = google.people({ version: "v1", auth });

  var simpleContacts: SimpleContact[] = [];
  var nextPageToken = "";

  do {
    const res = await service.people.connections.list({
      resourceName: "people/me",
      pageSize: pageSize,
      personFields: "names,emailAddresses,phoneNumbers",
      pageToken: nextPageToken,
    });

    nextPageToken = res.data.nextPageToken;
    const connections = res.data.connections;

    for (const connection of connections) {
      var phoneNumbers: string[] = [];
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
  auth: typeof AuthClient,
  resourceName: string,
  photo: Base64
): Promise<void> {
  const service = google.people({ version: "v1", auth });

  await service.people.updateContactPhoto({
    resourceName: resourceName,
    requestBody: { photoBytes: photo },
  });
}
