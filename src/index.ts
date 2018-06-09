import { authorize } from "./authorize";
import { google } from "googleapis";

authorize()
  .then(auth => doStuff(auth))
  .catch(err => console.log(`error: ${err}`));

async function doStuff(auth: any) {
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  const sheetData = await sheets.spreadsheets.values.get({
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    range: "Class Data!A2:E"
  });
  const rows = sheetData.data.values;
  if (rows && rows.length) {
    console.log("Name, Major:");
    // Print columns A and E, which correspond to indices 0 and 4.
    rows.map((row: any) => {
      console.log(`${row[0]}, ${row[4]}`);
    });
  } else {
    console.log("No data found.");
  }

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
