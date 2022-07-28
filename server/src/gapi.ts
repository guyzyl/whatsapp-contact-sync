const { google } = require("googleapis");

const dotenv = require("dotenv");
dotenv.config();

// TODO: Increase
const pageSize = 20;

// TODO: Create interface for idToken
export async function googleLogin(token: object) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.YOUR_CLIENT_SECRET
  );
  oauth2Client.setCredentials(token);
  // const response = await auth.refreshToken(credentials);

  // TODO: Redirect user at this stage;

  const contacts = listConnections(oauth2Client);
}

// TODO: Fix typing
function listConnections(auth: any) {
  const service = google.people({ version: "v1", auth });

  var nextPageToken = "";

  service.people.connections.list(
    {
      resourceName: "people/me",
      pageSize: pageSize,
      personFields: "names,emailAddresses,phoneNumbers",
      pageToken: nextPageToken,
    },
    // TODO: Fix typing
    (err: string, res: { data: { connections: any } }): void => {
      if (err) return console.error("The API returned an error: " + err);
      const connections = res.data.connections;
      if (connections) {
        for (const connection of connections) {
          console.log(connection);
          console.log(connection.names);
          console.log(connection.phoneNumbers);
        }
      } else {
        console.log("No connections found.");
      }
    }
  );
}
