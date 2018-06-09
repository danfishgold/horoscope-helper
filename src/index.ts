import { authorize } from "./authorize";
import { google } from "googleapis";
import { Sheet } from "./sheet";
import dotenv from "dotenv";
dotenv.config();



  }
async function hey() {
  const auth = await authorize();
  const sheet = await Sheet.new(
    auth,
    process.env.spreadsheet_id as string,
    process.env.sheet_name as string
  );
  await sheet.addRow(2, ["Hello", "World"]);
}

hey().catch(err => console.log(`error: ${err}`));
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
