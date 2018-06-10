import Telebot from "telebot";
import { authorize } from "./authorize";
import { google } from "googleapis";
import Sheet from "./sheet";
import Drive from "./drive";
import { maxBy } from "./junkDrawer";
import * as Signs from "./signs";
import Horoscope, { Field } from "./horoscope";
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

const bot = new Telebot({ token: process.env.telegram_token as string });

const conversations = new Map<string, Horoscope>();

bot.on("/start", msg => {
  msg.reply.text(
    "אהלן. כשיבוא לך להעלות צנזור, תשלח/י לי תמונה ואני אדריך אותך :)"
  );
});

bot.on("photo", msg => {
  const imageId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
  const horoscope = new Horoscope(imageId);
  conversations.set(msg.from.id, horoscope);
  requestNextField(msg, horoscope);
});

bot.on("text", msg => {
  onText(msg).catch(err => console.log("error: ", err));
});

async function onText(msg: any) {
  const horoscope = conversations.get(msg.from.id);
  if (!horoscope) {
    msg.reply.text("מה עם איזו תמונה או משהו בסגנון?");
    return;
  }

  switch (horoscope.nextEmptyField()) {
    case undefined:
      msg.reply.text("אני עדיין באמצע ההעלאה");
      return;
    case Field.Sign:
      const parsed = Signs.fromString(msg.text);
      if (parsed) {
        horoscope.sign = parsed;
      } else {
        msg.reply.text("לא הבנתי, אפשר שוב?");
        return;
      }
      break;
    case Field.Content:
      horoscope.content = msg.text;
      break;
    case Field.Censor:
      horoscope.censor = msg.text;
      break;
  }

  if (horoscope.nextEmptyField()) {
    requestNextField(msg, horoscope);
  } else {
    msg.reply.text("שניה, אני מעלה את ההורוסקופ");
    await uploadHoroscope(bot, horoscope, drive, sheet);
    conversations.delete(msg.from.id);
    msg.reply.text("זהו. זו הזדמנות פז להעלות הורוסקופ נוסף");
  }
}

async function uploadHoroscope(
  bot: Telebot,
  horoscope: Horoscope,
  drive: Drive,
  sheet: Sheet
) {
  const id = await sheet.nextAvailableId();
  await drive.uploadFileFromTelegram(
    bot,
    horoscope.imageId,
    `${id}.jpg`,
    process.env.horoscopes_folder_id as string
  );

  const { censor, sign, content } = horoscope;
  if (!censor || !sign || !content) {
    throw "Horoscope not ready";
  }
  const row = new Array(15);
  row.fill("");
  row[0] = id.toString();
  row[1] = censor;
  row[4] = Signs.toString(sign);
  row[14] = "TRUE";
  sheet.addRow(2, row);
}

function requestNextField(msg: any, horoscope: Horoscope) {
  switch (horoscope.nextEmptyField()) {
    case Field.Sign:
      msg.reply.text("איזה מזל? (התחיל לרדת גשם)", {
        replyMarkup: Signs.keyboard(bot)
      });
      break;
    case Field.Content:
      msg.reply.text("מה התוכן?");
      break;
    case Field.Censor:
      msg.reply.text("מי צנזר???");
      break;
  }
}

bot.start();
