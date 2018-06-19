import Telebot from "telebot";
import { maxBy } from "./junkDrawer";
import Bot from "./bot";
import { Elm } from "./elmHelper";
import dotenv from "dotenv";
dotenv.config();

const elm = Elm.Main.worker();

elm.ports.outPort.subscribe((msg: string) => {
  console.log("from elm: ", msg);
});

elm.ports.inPort.send("hello");

Bot.new(
  process.env.telegram_token as string,
  process.env.spreadsheet_id as string,
  process.env.sheet_name as string,
  process.env.horoscopes_folder_id as string
).then(bot => bot.start());
