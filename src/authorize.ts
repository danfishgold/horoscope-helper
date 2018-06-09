import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFile, writeFile, fileExists, readLine } from "./junkDrawer";
import { Credentials } from "google-auth-library/build/src/auth/credentials";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets"
];
const TOKEN_PATH = "credentials.json";

export async function authorize(): Promise<OAuth2Client> {
  const file = await readFile("client_secret.json");
  const credentials = JSON.parse(file);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  let token;
  if (await fileExists(TOKEN_PATH)) {
    token = JSON.parse(await readFile(TOKEN_PATH));
  } else {
    token = await getAccessToken(oAuth2Client);
  }
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function getAccessToken(
  oAuth2Client: OAuth2Client
): Promise<Credentials> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const code = await readLine("Enter the code from that page here: ");
  const tokenResponse = await oAuth2Client.getToken(code);
  const token = tokenResponse.tokens;
  // Store the token to disk for later program executions
  await writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log(`Token stored to ${TOKEN_PATH}`);
  return token;
}
