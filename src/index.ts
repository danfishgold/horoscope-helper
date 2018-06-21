import Telebot from "telebot";
import authorize from "./authorize";
import Sheet from "./sheet";
import Drive from "./drive";
import { maxBy } from "./junkDrawer";
import { Elm } from "./elmHelper";
import dotenv from "dotenv";
dotenv.config();

const telegramToken = process.env.telegram_test_token as string;
const spreadsheetId = process.env.spreadsheet_id as string;
const sheetName = process.env.sheet_name as string;
const folderId = process.env.horoscopes_folder_id as string;

const elm = Elm.Main.worker();
const bot = new Telebot({ token: telegramToken });
let drive: Drive;
let sheet: Sheet;

async function setup() {
  const auth = await authorize();
  drive = new Drive(auth);
  sheet = await Sheet.new(auth, spreadsheetId, sheetName);
}

async function uploadHoroscope(
  photoId: string,
  content: string,
  sign: string,
  censor: string
) {
  const id = await sheet.nextAvailableId();
  await drive.uploadFileFromTelegram(bot, photoId, `${id}.jpg`, folderId);

  const row = new Array(15);
  row.fill("");
  row[0] = id.toString();
  row[1] = censor;
  row[4] = sign;
  row[5] = content;
  row[11] = "=AVERAGE(G2:K2)";
  row[14] = "TRUE";
  await sheet.addRow(2, row);
}

bot.on("text", msg => {
  console.log("received text");
  elm.ports.onText.send([msg.from.id, msg.text]);
});

bot.on("photo", msg => {
  console.log("received photo");
  const imageId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
  elm.ports.onPhoto.send([msg.from.id, imageId]);
});

elm.ports.sendText.subscribe(
  ([delay, chatId, text]: [number, number, string]) => {
    if (delay == 0) {
      bot.sendMessage(chatId, text);
    } else {
      setTimeout(() => bot.sendMessage(chatId, text), delay);
    }
  }
);

elm.ports.sendPhoto.subscribe(
  ([delay, chatId, photoId]: [number, number, string]) => {
    if (delay == 0) {
      bot.sendPhoto(chatId, photoId);
    } else {
      setTimeout(() => bot.sendPhoto(chatId, photoId), delay);
    }
  }
);

elm.ports.uploadHoroscope.subscribe(
  ([chatId, photoId, content, sign, censor]: [
    number,
    string,
    string,
    string,
    string
  ]) => {
    uploadHoroscope(photoId, content, sign, censor)
      .then(() => elm.ports.doneUploading.send(chatId))
      .catch(err => elm.ports.errorUploading.send([chatId, err]));
  }
);

setup()
  .then(() => bot.start())
  .catch(err => console.error(err));
