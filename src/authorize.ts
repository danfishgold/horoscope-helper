import * as fs from "fs";
import * as readline from "readline";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets"
];
const TOKEN_PATH = "credentials.json";

function readFile(path: string): Promise<any> {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, function(err: Error, content: any) {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

function writeFile(path: string, data: any): Promise<null> {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, function(err: Error) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function fileExists(path: string): Promise<boolean> {
  return new Promise(function(resolve, reject) {
    fs.stat(path, function(err: Error, stats: any) {
      if (err) resolve(false);
      else resolve(stats.isFile());
    });
  });
}

function readLine(question: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, function(answer: string) {
      rl.close();
      resolve(answer);
    });
  });
}

export async function authorize() {
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

async function getAccessToken(oAuth2Client: any) {
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
