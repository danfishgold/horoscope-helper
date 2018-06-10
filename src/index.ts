import Telebot from "telebot";
import { authorize } from "./authorize";
import { google } from "googleapis";
import Sheet from "./sheet";
import Drive from "./drive";
import { maxBy } from "./junkDrawer";
import dotenv from "dotenv";
dotenv.config();

let drive: Drive, sheet: Sheet;
authorize()
  .then(auth => {
    drive = new Drive(auth);
    return Sheet.new(
      auth,
      process.env.spreadsheet_id as string,
      process.env.sheet_name as string
    );
  })
  .then(sh => (sheet = sh))
  .catch(err => console.log(`error: ${err}`));

// await sheet.addRow(2, ["Hello", "World"]);
// await drive.addFolder(process.env.horoscopes_folder_id as string, "heyyyy");

const bot = new Telebot({ token: process.env.telegram_token as string });

bot.on("photo", msg => {
  const fileId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
  drive
    .uploadFileFromTelegram(bot, fileId, process.env
      .horoscopes_folder_id as string)
    .catch(err => console.log(`error: ${err}`));
});

bot.start();
