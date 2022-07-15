import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const scopes = ["https://www.googleapis.com/auth/contacts"];
const tokenPath = "token.json";
const credentialsPath = "credentials.json";

// TODO: Increase
const pageSize = 20;

fs.readFile(credentialsPath, (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  authorize(JSON.parse(content), listConnections);
});

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(tokenPath, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(tokenPath, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", tokenPath);
      });
      callback(oAuth2Client);
    });
  });
}

function listConnections(auth) {
  const service = google.people({ version: "v1", auth });

  var nextPageToken;

  service.people.connections.list(
    {
      resourceName: "people/me",
      pageSize: pageSize,
      personFields: "names,emailAddresses,phoneNumbers",
      nextPageToken: nextPageToken
    },
    (err, res) => {
      if (err) return console.error("The API returned an error: " + err);
      const connections = res.data.connections;
      if (connections) {
        for (const connection of connections) {
          console.log(connection.names);
          console.log(connection.phoneNumbers);
        }
      } else {
        console.log("No connections found.");
      }
    }
  );
}
