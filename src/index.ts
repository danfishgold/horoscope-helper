import { authorize } from "./authorize";
import { google } from "googleapis";
import { Sheet } from "./sheet";
import { Drive } from "./drive";
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

  const drive = new Drive(auth);
  await drive.addFolder(process.env.horoscopes_folder_id as string, "heyyyy");
}

hey().catch(err => console.log(`error: ${err}`));
