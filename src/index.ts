import dotenv from "dotenv";
import { authorize } from "./authorize";
import { google } from "googleapis";

authorize()
  .then(auth => addRow(auth, 2, ["אהלן", "גבר"]))
  .catch(err => console.log(`error: ${err}`));

async function addRow(auth: any, rowIndex: number, row: string[]) {
  const spreadsheetId = process.env.spreadsheet_id;
  const sheetName = process.env.sheet_name;

  const sheets = google.sheets({ version: "v4", auth });

  // Find the sheet id
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  if (!spreadsheet.data.sheets) {
    throw "Couldn't load spreadsheet";
  }
  const sheet = spreadsheet.data.sheets.find(
    sheet => (sheet.properties ? sheet.properties.title == sheetName : false)
  );
  if (!sheet || !sheet.properties || sheet.properties.sheetId) {
    throw `Couldn't find the sheet named "${sheetName}"`;
  }
  const sheetId = sheet.properties.sheetId;

  // Insert a new empty row
  const range = {
    sheetId,
    dimension: "ROWS",
    startIndex: rowIndex - 1,
    endIndex: rowIndex
  };
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ insertDimension: { range } }] }
  });

  // Fill in the new row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] }
  });
}

async function listFiles(auth: any) {
  const drive = google.drive({ version: "v3", auth });

  const fileData = await drive.files.list({ pageSize: 10 });
  const files = fileData.data.files;
  if (files && files.length) {
    console.log("Files:");
    files.map(file => {
      console.log(`${file.name} (${file.id})`);
    });
  } else {
    console.log("No files found.");
  }
}
