// import Bot from "./bot";
import Telebot from "telebot";
import { maxBy } from "./junkDrawer";
import { Elm } from "./elmHelper";
import dotenv from "dotenv";
dotenv.config();

const elm = Elm.Main.worker();
const bot = new Telebot({ token: process.env.telegram_test_token as string });

bot.on("text", msg => elm.ports.onText.send([msg.text, msg.from.id]));

bot.on("photo", msg => {
  const imageId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
  elm.ports.onPhoto.send([imageId, msg.from.id]);
});

elm.ports.sendText.subscribe(([text, chatId]: [string, number]) => {
  bot.sendMessage(chatId, text);
});

elm.ports.sendPhoto.subscribe(([photoId, chatId]: [string, number]) => {
  bot.sendPhoto(chatId, photoId);
});

bot.start();

// elm.ports.outPort.subscribe((msg: string) => {
//   console.log("from elm: ", msg);
// });

// elm.ports.inPort.send("hello");

// Bot.new(
//   process.env.telegram_token as string,
//   process.env.spreadsheet_id as string,
//   process.env.sheet_name as string,
//   process.env.horoscopes_folder_id as string
// ).then(bot => bot.start());
